const mongoose = require('mongoose');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const StaffNotification = require('../models/StaffNotification');
const Staff = require('../models/Staff');
const { classifyStaffChat } = require('./staffChatRouting');

const memoryState = {
  conversations: [],
  messages: [],
  notifications: [],
};

async function pickLeastLoadedStaff(department) {
  if (mongoose.connection.readyState !== 1) return '';
  const staff = await Staff.find({ department, isActive: true }).select('_id email').lean();
  if (!staff.length) return '';
  const emails = staff.map((item) => item.email);
  const loads = await StaffConversation.aggregate([
    { $match: { department, assignedTo: { $in: emails }, status: { $ne: 'Closed' } } },
    { $group: { _id: '$assignedTo', activeChats: { $sum: 1 } } },
  ]);
  const loadByEmail = new Map(loads.map((item) => [item._id, item.activeChats]));
  staff.sort((left, right) =>
    (loadByEmail.get(left.email) || 0) - (loadByEmail.get(right.email) || 0) ||
    String(left._id).localeCompare(String(right._id))
  );
  return staff[0].email;
}

async function backfillStaffConversationQueues() {
  if (mongoose.connection.readyState === 1) {
    const conversations = await StaffConversation.find({
      $or: [{ queueType: { $exists: false } }, { queueType: 'Unclassified' }],
    }).lean();
    if (!conversations.length) return 0;
    const ids = conversations.map((conversation) => conversation.conversationId);
    const messages = await StaffMessage.find({ conversationId: { $in: ids }, sender: 'customer' })
      .select('conversationId text')
      .sort({ createdAt: 1 })
      .lean();
    const textByConversation = new Map();
    for (const message of messages) {
      const previous = textByConversation.get(message.conversationId) || '';
      textByConversation.set(message.conversationId, `${previous} ${message.text || ''}`.trim());
    }
    const operations = [];
    for (const conversation of conversations) {
      const route = classifyStaffChat({
        userType: conversation.userType,
        jobTitle: conversation.jobTitle,
        destination: conversation.destination,
        message_text: textByConversation.get(conversation.conversationId) || conversation.lastMessage,
      });
      if (conversation.department !== 'Customer Care' && !conversation.queueType) {
        route.department = conversation.department;
      }
      operations.push({
        updateOne: {
          filter: { _id: conversation._id, $or: [{ queueType: { $exists: false } }, { queueType: 'Unclassified' }] },
          update: { $set: {
            ...route,
            assignedTo: conversation.assignedTo || await pickLeastLoadedStaff(route.department),
          } },
        },
      });
    }
    if (operations.length) await StaffConversation.bulkWrite(operations, { ordered: false });
    return operations.length;
  }

  let updated = 0;
  for (const conversation of memoryState.conversations) {
    if (conversation.queueType && conversation.queueType !== 'Unclassified') continue;
    const texts = memoryState.messages
      .filter((message) => message.conversationId === conversation.conversationId && message.sender === 'customer')
      .map((message) => message.text || '')
      .join(' ');
    const route = classifyStaffChat({
      userType: conversation.userType,
      jobTitle: conversation.jobTitle,
      destination: conversation.destination,
      message_text: texts || conversation.lastMessage,
    });
    Object.assign(conversation, route);
    updated += 1;
  }
  return updated;
}

async function ingestIncomingBlissAppMessage(payload = {}) {
  const messageText = payload.message_text || payload.message || payload.text || payload.body || '';
  const customerName = payload.customerName || payload.name || payload.senderName || 'Bliss App User';
  const customerEmail = payload.customerEmail || payload.email || '';
  const customerPhone = payload.customerPhone || payload.phone || payload.phoneNumber || '';
  const blissId = payload.blissId || payload.bliss_id || payload.userId || payload.candidateCode || '';
  const userType = payload.userType || 'Unknown';
  const country = payload.country || '';
  const priority = payload.priority || 'Normal';
  const route = classifyStaffChat(payload);
  const userId = payload.userId || payload.sender_id || payload.user_id || payload.customerId || '';

  const conversationId = payload.conversationId || payload.conversation_id ||
    (userId ? `bliss-app-${userId}` : `bliss-app-${Date.now()}`);

  if (!messageText.trim()) {
    throw new Error('incoming message text is required');
  }

  if (mongoose.connection.readyState === 1) {
    let existingConversation = await StaffConversation.findOne({ conversationId }).lean();
    if (!existingConversation) {
      const identityMatches = [];
      if (customerPhone) identityMatches.push({ customerPhone });
      if (customerEmail) identityMatches.push({ customerEmail });
      if (blissId) identityMatches.push({ blissId });
      if (identityMatches.length) {
        existingConversation = await StaffConversation.findOne({ $or: identityMatches }).lean();
      }
    }
    const autoAssignee = existingConversation?.assignedTo
      ? ''
      : await pickLeastLoadedStaff(route.department);

    const conversationPayload = {
      conversationId,
      customerName,
      customerEmail,
      customerPhone,
      blissId,
      userType,
      country,
      status: existingConversation ? 'Open' : 'New',
      priority,
      assignedTo: existingConversation?.assignedTo || autoAssignee,
      ...route,
      unreadCount: (existingConversation?.unreadCount || 0) + 1,
      lastMessage: messageText,
      lastActive: 'Just now',
      online: true,
    };

    if (existingConversation?.queueType && existingConversation.queueType !== 'Unclassified') {
      Object.assign(conversationPayload, {
        queueType: existingConversation.queueType,
        queueName: existingConversation.queueName,
        department: existingConversation.department,
        jobTitle: existingConversation.jobTitle || route.jobTitle,
        destination: existingConversation.destination || route.destination,
      });
    }

    const conversation = existingConversation
      ? await StaffConversation.findOneAndUpdate(
          { _id: existingConversation._id },
          {
            $set: {
              ...conversationPayload,
              unreadCount: (existingConversation.unreadCount || 0) + 1,
            },
          },
          { new: true, upsert: true }
        )
      : await StaffConversation.create(conversationPayload);

    const message = await StaffMessage.create({
      conversationId: conversation.conversationId || conversationId,
      sender: 'customer',
      text: messageText,
      type: payload.message_type || payload.type || 'text',
      read: false,
    });

    const notification = await StaffNotification.create({
      title: 'Bliss app message received',
      body: `${customerName} sent: ${messageText}`,
      type: 'chat',
      read: false,
    });

    return {
      success: true,
      conversation,
      message,
      notification,
      conversationId: conversation.conversationId || conversationId,
    };
  }

  const existingConversation = memoryState.conversations.find(
    (item) => item.conversationId === conversationId ||
      (customerPhone && item.customerPhone === customerPhone) ||
      (customerEmail && item.customerEmail === customerEmail) ||
      (blissId && item.blissId === blissId)
  );
  const autoAssignee = existingConversation?.assignedTo
    ? ''
    : await pickLeastLoadedStaff(route.department);

  if (existingConversation) {
    existingConversation.customerName = customerName;
    existingConversation.customerEmail = customerEmail;
    existingConversation.customerPhone = customerPhone;
    existingConversation.blissId = blissId;
    existingConversation.country = country;
    existingConversation.userType = userType;
    const effectiveRoute = existingConversation.queueType && existingConversation.queueType !== 'Unclassified'
      ? {
          queueType: existingConversation.queueType,
          queueName: existingConversation.queueName,
          department: existingConversation.department,
          jobTitle: existingConversation.jobTitle || route.jobTitle,
          destination: existingConversation.destination || route.destination,
        }
      : route;
    Object.assign(existingConversation, effectiveRoute);
    existingConversation.priority = priority;
    existingConversation.status = 'Open';
    if (!existingConversation.assignedTo) existingConversation.assignedTo = autoAssignee;
    existingConversation.unreadCount = Number(existingConversation.unreadCount || 0) + 1;
    existingConversation.lastMessage = messageText;
    existingConversation.lastActive = 'Just now';
    existingConversation.online = true;
  } else {
    memoryState.conversations.push({
      conversationId,
      customerName,
      customerEmail,
      customerPhone,
      blissId,
      userType,
      country,
      status: 'New',
      priority,
      assignedTo: autoAssignee,
      ...route,
      unreadCount: 1,
      lastMessage: messageText,
      lastActive: 'Just now',
      online: true,
      notes: [],
    });
  }

  const persistedMessage = {
    conversationId,
    sender: 'customer',
    text: messageText,
    type: payload.message_type || payload.type || 'text',
    read: false,
    createdAt: new Date().toISOString(),
  };

  memoryState.messages.push(persistedMessage);

  const notification = {
    title: 'Bliss app message received',
    body: `${customerName} sent: ${messageText}`,
    type: 'chat',
    read: false,
    createdAt: new Date().toISOString(),
  };

  memoryState.notifications.push(notification);

  return {
    success: true,
    conversation: existingConversation || memoryState.conversations[memoryState.conversations.length - 1],
    message: persistedMessage,
    notification,
    conversationId,
  };
}

module.exports = {
  ingestIncomingBlissAppMessage,
  backfillStaffConversationQueues,
};
