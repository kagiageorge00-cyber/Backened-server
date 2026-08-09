const mongoose = require('mongoose');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const StaffNotification = require('../models/StaffNotification');

// This service requires a connected database. In-memory fallbacks were removed
// to ensure all incoming app messages are persisted to the DB.

async function ingestIncomingBlissAppMessage(payload = {}) {
  const messageText = payload.message_text || payload.message || payload.text || payload.body || '';
  const customerName = payload.customerName || payload.name || payload.senderName || 'Bliss App User';
  const customerEmail = payload.customerEmail || payload.email || '';
  const customerPhone = payload.customerPhone || payload.phone || payload.phoneNumber || '';
  const blissId = payload.blissId || payload.bliss_id || payload.userId || payload.candidateCode || '';
  const userType = payload.userType || 'Candidate';
  const country = payload.country || 'Kenya';
  const priority = payload.priority || 'Normal';
  const department = payload.department || 'Customer Care';
  const userId = payload.userId || payload.sender_id || payload.user_id || payload.customerId || '';

  const conversationId = payload.conversationId || payload.conversation_id ||
    (userId ? `bliss-app-${userId}` : `bliss-app-${Date.now()}`);

  if (!messageText.trim()) {
    throw new Error('incoming message text is required');
  }

  if (mongoose.connection.readyState === 1) {
    const existingConversation = await StaffConversation.findOne({
      $or: [
        { conversationId },
        { customerPhone: customerPhone || undefined },
        { customerEmail: customerEmail || undefined },
        { blissId: blissId || undefined },
      ],
    }).lean();

    const conversationPayload = {
      conversationId,
      customerName,
      customerEmail,
      customerPhone,
      blissId,
      userType,
      country,
      status: 'Open',
      priority,
      assignedTo: payload.assignedTo || 'Hannah Maina',
      department,
      unreadCount: (existingConversation?.unreadCount || 0) + 1,
      lastMessage: messageText,
      lastActive: 'Just now',
      online: true,
    };

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

  // If we reach here it means the database is not connected — fail loudly
  // so callers know messages were not persisted.
  throw new Error('Database not connected - cannot persist incoming message');
}

module.exports = {
  ingestIncomingBlissAppMessage,
};
