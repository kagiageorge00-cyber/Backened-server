const mongoose = require('mongoose');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const StaffNotification = require('../models/StaffNotification');
const Staff = require('../models/Staff');
const Notification = require('../models/Notification');
const BlissCommunicationUser = require('../models/BlissCommunicationUser');
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

async function createStaffPushNotifications(conversation, message, customerName) {
  if (mongoose.connection.readyState !== 1) return [];

  let recipients = [];
  const assignedTo = String(conversation.assignedTo || '').trim();
  if (assignedTo) {
    const assignedStaff = await Staff.findOne({
      $or: [{ email: assignedTo }, { fullName: assignedTo }],
    }).select('email').lean();
    if (assignedStaff?.email) recipients = [assignedStaff.email];
  }

  if (!recipients.length) {
    const staff = await Staff.find({
      department: conversation.department,
      isActive: { $ne: false },
    }).select('email').lean();
    recipients = staff.map((entry) => entry.email).filter(Boolean);
  }

  const uniqueRecipients = [...new Set(
    recipients.map((email) => String(email).trim().toLowerCase()).filter(Boolean),
  )];
  const deliveries = await Promise.allSettled(uniqueRecipients.map((userId) =>
    Notification.create({
      notificationId: `CHAT-${message._id?.toString() || Date.now()}-${userId}`,
      userId,
      userType: 'staff',
      title: `${customerName} sent a message`,
      message: message.text,
      notificationType: 'bliss_app_message',
      category: 'message',
      actionUrl: process.env.STAFF_PORTAL_URL || '',
      entityType: 'conversation',
      entityId: conversation.conversationId,
    }),
  ));
  for (const delivery of deliveries) {
    if (delivery.status === 'rejected') {
      console.error('Staff push notification could not be saved:', delivery.reason?.message || delivery.reason);
    }
  }
  return deliveries;
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
  const blissId = payload.blissId || payload.bliss_id || payload.userId || payload.candidateCode || '';
  let customerProfile = null;
  if (
    mongoose.connection.readyState === 1 &&
    blissId &&
    (!payload.customerName || !payload.customerEmail || !payload.customerPhone)
  ) {
    customerProfile = await BlissCommunicationUser.findOne({ blissId })
      .select('fullName email phone country')
      .lean();
  }
  const customerName =
    payload.customerName ||
    payload.name ||
    payload.senderName ||
    customerProfile?.fullName ||
    'Bliss App User';
  const customerEmail =
    payload.customerEmail || payload.email || customerProfile?.email || '';
  const customerPhone =
    payload.customerPhone ||
    payload.phone ||
    payload.phoneNumber ||
    customerProfile?.phone ||
    '';
  const userType = payload.userType || 'Unknown';
  const country = payload.country || customerProfile?.country || '';
  const priority = payload.priority || 'Normal';
  const route = classifyStaffChat(payload);
  const userId = payload.userId || payload.sender_id || payload.user_id || payload.customerId || '';
  const sourceMessageId = String(payload.sourceMessageId || payload.source_message_id || '');

  const conversationId = payload.conversationId || payload.conversation_id ||
    (userId ? `bliss-app-${userId}` : `bliss-app-${Date.now()}`);

  if (!messageText.trim()) {
    throw new Error('incoming message text is required');
  }

  if (mongoose.connection.readyState === 1) {
    if (sourceMessageId) {
      const existingMessage = await StaffMessage.findOne({ sourceMessageId }).lean();
      if (existingMessage) {
        const existingConversation = await StaffConversation.findOne({
          conversationId: existingMessage.conversationId,
        }).lean();
        return {
          success: true,
          conversation: existingConversation,
          message: existingMessage,
          notification: null,
          conversationId: existingMessage.conversationId,
          duplicate: true,
        };
      }
    }

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
    const staffConversationId = existingConversation?.conversationId || conversationId;
    const blissAppConversationId = payload.blissAppConversationId ||
      (payload.channel !== 'whatsapp' && conversationId.startsWith('bliss-app-')
        ? conversationId.slice('bliss-app-'.length)
        : existingConversation?.blissAppConversationId || '');
    const autoAssignee = existingConversation?.assignedTo
      ? ''
      : await pickLeastLoadedStaff(route.department);
    const channel = String(payload.channel || 'bliss_app').toLowerCase();
    const channels = [...new Set([...(existingConversation?.channels || []), channel])];

    const conversationPayload = {
      conversationId: staffConversationId,
      blissAppConversationId,
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
      channels,
      lastActive: 'Just now',
      online: true,
      lastCustomerActiveAt: new Date(),
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
      senderName: customerName,
      text: messageText,
      type: payload.message_type || payload.type || 'text',
      channel,
      attachmentUrl: payload.attachmentUrl || payload.attachment_url || '',
      attachmentName: payload.attachmentName || payload.attachment_name || '',
      attachmentMimeType: payload.attachmentMimeType || payload.attachment_mime_type || '',
      read: false,
      ...(sourceMessageId ? { sourceMessageId } : {}),
    });

    const notification = await StaffNotification.create({
      title: `${customerName} sent a message`,
      body: messageText,
      type: 'chat',
      read: false,
    });
    try {
      await createStaffPushNotifications(conversation, message, customerName);
    } catch (error) {
      console.error('Staff push notification delivery failed:', error.message);
    }

    return {
      success: true,
      conversation,
      message,
      notification,
      conversationId: conversation.conversationId || conversationId,
    };
  }

  if (
    sourceMessageId &&
    memoryState.messages.some((message) => message.sourceMessageId === sourceMessageId)
  ) {
    const existingMessage = memoryState.messages.find(
      (message) => message.sourceMessageId === sourceMessageId,
    );
    return {
      success: true,
      conversation: memoryState.conversations.find(
        (item) => item.conversationId === existingMessage.conversationId,
      ) || null,
      message: existingMessage,
      notification: null,
      conversationId: existingMessage.conversationId,
      duplicate: true,
    };
  }

  const existingConversation = memoryState.conversations.find(
    (item) => item.conversationId === conversationId ||
      (customerPhone && item.customerPhone === customerPhone) ||
      (customerEmail && item.customerEmail === customerEmail) ||
      (blissId && item.blissId === blissId)
  );
  const memoryConversationId = existingConversation?.conversationId || conversationId;
  const memoryBlissAppConversationId = payload.blissAppConversationId ||
    (payload.channel !== 'whatsapp' && conversationId.startsWith('bliss-app-')
      ? conversationId.slice('bliss-app-'.length)
      : existingConversation?.blissAppConversationId || '');
  const autoAssignee = existingConversation?.assignedTo
    ? ''
    : await pickLeastLoadedStaff(route.department);
  const channel = String(payload.channel || 'bliss_app').toLowerCase();

  if (existingConversation) {
    existingConversation.blissAppConversationId = memoryBlissAppConversationId;
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
    existingConversation.channels = [
      ...new Set([...(existingConversation.channels || []), channel]),
    ];
    existingConversation.lastActive = 'Just now';
    existingConversation.online = true;
    existingConversation.lastCustomerActiveAt = new Date();
  } else {
    memoryState.conversations.push({
      conversationId: memoryConversationId,
      blissAppConversationId: memoryBlissAppConversationId,
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
      channels: [channel],
      lastActive: 'Just now',
      online: true,
      lastCustomerActiveAt: new Date(),
      notes: [],
    });
  }

  const persistedMessage = {
    conversationId: memoryConversationId,
    sender: 'customer',
    senderName: customerName,
    text: messageText,
    type: payload.message_type || payload.type || 'text',
    channel,
    attachmentUrl: payload.attachmentUrl || payload.attachment_url || '',
    attachmentName: payload.attachmentName || payload.attachment_name || '',
    attachmentMimeType: payload.attachmentMimeType || payload.attachment_mime_type || '',
    read: false,
    createdAt: new Date().toISOString(),
    ...(sourceMessageId ? { sourceMessageId } : {}),
  };

  memoryState.messages.push(persistedMessage);

  const notification = {
    title: `${customerName} sent a message`,
    body: messageText,
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
    conversationId: memoryConversationId,
  };
}

async function connectStaffOperationsDatabase(uri) {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

async function setCustomerPresence(blissId, online) {
  const lastCustomerActiveAt = online ? new Date() : null;
  if (mongoose.connection.readyState === 1) {
    const result = await StaffConversation.updateMany(
      { blissId },
      { $set: { online, lastCustomerActiveAt } },
    );
    return result.modifiedCount ?? result.nModified ?? 0;
  }

  let updated = 0;
  for (const conversation of memoryState.conversations) {
    if (conversation.blissId !== blissId) continue;
    conversation.online = online;
    conversation.lastCustomerActiveAt = lastCustomerActiveAt;
    updated += 1;
  }
  return updated;
}

async function syncStaffReplyToBlissApp({ conversationId, conversation, message }) {
  const prefix = 'bliss-app-';
  const customerConversationId = conversation?.blissAppConversationId ||
    (conversationId?.startsWith(prefix) ? conversationId.slice(prefix.length) : '');
  if (!customerConversationId) {
    return { success: false, skipped: true, reason: 'not_a_bliss_app_conversation' };
  }
  if (mongoose.connection.readyState !== 1) {
    return { success: false, skipped: true, reason: 'database_unavailable' };
  }

  const database = mongoose.connection.db;
  const appConversation = await database.collection('inbox_conversations').findOne({
    conversationId: customerConversationId,
  });
  const numericConversationId = Number(customerConversationId);
  const appDatabaseConversation = Number.isSafeInteger(numericConversationId)
    ? await database.collection('conversations').findOne({
        id: numericConversationId,
      })
    : null;

  const messageId = message?._id?.toString?.() || message?.id;
  if (!messageId) throw new Error('Staff reply is missing its message identifier.');
  const id = `staff-reply-${messageId}`;
  const createdAt = message.createdAt || new Date();
  const text = String(message.text || '');
  let insertedInboxMessage = false;
  if (appConversation) {
    const inboxResult = await database.collection('inbox_messages').updateOne(
      { _id: id },
      {
        $setOnInsert: {
          _id: id,
          id,
          conversationId: customerConversationId,
          senderId: 'staff',
          receiverId: appConversation.userId,
          senderName: message.senderName || 'Bliss Connect',
          messageType: message.type || 'text',
          messageText: text,
          attachmentUrl: message.attachmentUrl || '',
          attachmentName: message.attachmentName || '',
          attachmentMimeType: message.attachmentMimeType || '',
          read: false,
          createdAt,
          updatedAt: createdAt,
        },
      },
      { upsert: true },
    );
    insertedInboxMessage = inboxResult.upsertedCount > 0;
  }

  let insertedAppMessage = false;
  if (appDatabaseConversation) {
    const appMessage = {
      _id: id,
      id,
      conversation_id: appDatabaseConversation.id,
      sender_id: 'bliss-connect',
      sender_name: message.senderName || 'Bliss Connect',
      receiver_id: appDatabaseConversation.user_id,
      message_type: message.type || 'text',
      message_text: text || (message.attachmentName ? `Shared ${message.attachmentName}` : 'Attachment'),
      attachment_url: message.attachmentUrl || '',
      attachment_name: message.attachmentName || '',
      attachment_mime_type: message.attachmentMimeType || '',
      read: false,
      created_at: createdAt,
      updated_at: createdAt,
    };
    const appMessageResult = await database.collection('messages').updateOne(
      { _id: id },
      { $setOnInsert: appMessage },
      { upsert: true },
    );
    insertedAppMessage = appMessageResult.upsertedCount > 0;
    if (insertedAppMessage) {
      await database.collection('conversations').updateOne(
        { _id: appDatabaseConversation._id },
        {
          $set: {
            last_message: appMessage.message_text,
            updated_at: createdAt,
          },
        },
      );
    }
  }

  const Conversation = require('../models/Conversation');
  const Message = require('../models/Message');
  const legacyConversation = mongoose.Types.ObjectId.isValid(customerConversationId)
    ? await Conversation.findById(customerConversationId).lean()
    : null;
  let insertedLegacyMessage = false;
  if (legacyConversation) {
    const legacyResult = await Message.updateOne(
      { sourceMessageId: id },
      {
        $setOnInsert: {
          conversationId: customerConversationId,
          senderId: 'support',
          receiverId: legacyConversation.participants?.find((id) => !['support', 'staff'].includes(String(id))) || '',
          senderType: 'support',
          message: text || (message.attachmentName ? `Shared ${message.attachmentName}` : 'Attachment'),
          messageType: message.type || 'text',
          attachmentUrl: message.attachmentUrl || '',
          attachmentName: message.attachmentName || '',
          attachmentMimeType: message.attachmentMimeType || '',
          sourceMessageId: id,
          createdAt,
        },
      },
      { upsert: true },
    );
    insertedLegacyMessage = legacyResult.upsertedCount > 0;
    if (insertedLegacyMessage) {
      await Conversation.updateOne(
        { _id: legacyConversation._id },
        { $set: { updatedAt: createdAt } },
      );
    }
  }
  if (insertedInboxMessage && appConversation) {
    await database.collection('inbox_conversations').updateOne(
      { _id: appConversation._id },
      {
        $set: { lastMessage: text, updatedAt: createdAt },
        $inc: { unreadCount: 1 },
      },
    );
  }
  return {
    success: Boolean(appConversation || appDatabaseConversation || legacyConversation),
    duplicate: !insertedInboxMessage && !insertedAppMessage && !insertedLegacyMessage,
    messageId: id,
    legacyConversationSynced: Boolean(legacyConversation),
    inboxConversationSynced: Boolean(appConversation),
    appConversationSynced: Boolean(appDatabaseConversation),
  };
}

module.exports = {
  ingestIncomingBlissAppMessage,
  connectStaffOperationsDatabase,
  backfillStaffConversationQueues,
  setCustomerPresence,
  syncStaffReplyToBlissApp,
};
