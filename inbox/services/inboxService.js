const crypto = require('crypto');
const mongoose = require('mongoose');
const StaffConversation = require('../../models/StaffConversation');
const Staff = require('../../models/Staff');
const StaffNotification = require('../../models/StaffNotification');
const Notification = require('../../models/Notification');
const BlissCommunicationUser = require('../../models/BlissCommunicationUser');
const { generateRtcSession } = require('../../services/rtcService');
const { emitToUser } = require('../socket/socketService');
const staffOperationsBridge = require('../../services/staffOperationsBridge');

class InboxService {
  constructor(repository, notificationService = null, socketService = null) {
    this.repository = repository;
    this.notificationService = notificationService;
    this.socketService = socketService;
  }

  async getConversations(user, pagination = {}) {
    const conversations = await this.repository.listConversations(user, pagination);
    return {
      success: true,
      conversations,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
      },
    };
  }

  async createConversation(user, payload = {}) {
    const department =
      typeof payload.department === 'string' && payload.department.trim()
        ? payload.department.trim()
        : 'Customer Care';
    const conversation = await this.repository.createConversation(user, department);
    const serviceInterest = typeof payload.serviceInterest === 'string'
      ? payload.serviceInterest.trim()
      : '';
    if (serviceInterest) {
      if (serviceInterest.length > 200) {
        throw new Error('Service interest is too long.');
      }
      const firstName =
        String(user.fullName || '').trim().split(/\s+/)[0] || 'there';
      await this.repository.createMessage({
        conversationId: conversation.id || conversation.conversationId,
        senderId: conversation.departmentId || 'dept-customer-care',
        receiverId: user.blissId,
        senderType: 'support',
        messageType: 'text',
        messageText:
          `Hi ${firstName}! Thanks for enquiring about ${serviceInterest}. ` +
          "You're in the right place. Our Bliss Connect team is here to " +
          "guide you through the next steps. Tell us a little more about " +
          "what you need, and we'll be happy to help.",
      });
    }
    return { success: true, data: { conversation } };
  }

  async getConversationDetails(user, conversationId) {
    const conversation = await this.repository.getConversation(conversationId);

    if (!conversation) {
      return { success: false, message: 'Conversation not found.' };
    }

    if (conversation.userId && conversation.userId !== user.blissId) {
      return { success: false, message: 'You are not authorized to access this conversation.' };
    }

    return { success: true, conversation };
  }

  async getMessages(user, conversationId, pagination = {}) {
    const conversation = await this.repository.getConversation(conversationId);
    if (!conversation) {
      return { success: false, message: 'Conversation not found.' };
    }

    if (conversation.userId && conversation.userId !== user.blissId) {
      return { success: false, message: 'You are not authorized to access this conversation.' };
    }

    const result = await this.repository.getMessages(conversationId, pagination);
    const messages = Array.isArray(result) ? result : result.messages;
    const messagePagination = Array.isArray(result)
      ? { page: pagination.page || 1, limit: pagination.limit || 50 }
      : result.pagination;
    if (this.repository.markMessageDelivered) {
      await Promise.all(messages.map(async (message) => {
        const senderId = String(message.senderId || message.sender_id || '')
          .toLowerCase();
        const messageId = String(message.id || message._id || '');
        if (
          !messageId ||
          !['staff', 'bliss-connect'].includes(senderId) ||
          message.delivered === true ||
          message.deliveredAt ||
          message.delivered_at
        ) {
          return;
        }
        const receipt = await this.repository.markMessageDelivered(messageId);
        Object.assign(message, receipt);
      }));
    }
    return { success: true, messages, pagination: messagePagination };
  }

  async sendMessage(user, conversationId, payload) {
    const conversation = await this.repository.getConversation(conversationId);
    if (!conversation) {
      return { success: false, message: 'Conversation not found.' };
    }

    if (conversation.userId && conversation.userId !== user.blissId) {
      return { success: false, message: 'You are not authorized to send messages in this conversation.' };
    }

    const messageText = String(
      payload.messageText ?? payload.message_text ?? payload.text ?? '',
    ).trim();
    if (!messageText) {
      return { success: false, message: 'Message text is required.' };
    }

    const attachmentMimeType =
      payload.attachmentMimeType || payload.attachment_mime_type || '';
    const messageType = normalizeMessageType(
      payload.messageType || payload.message_type || 'text',
      attachmentMimeType,
    );
    const message = await this.repository.createMessage({
      conversationId,
      senderId: user.blissId,
      receiverId: conversation.departmentId,
      messageType,
      messageText,
      attachmentUrl: payload.attachmentUrl || payload.attachment_url || null,
      attachmentName: payload.attachmentName || payload.attachment_name || null,
      attachmentMimeType: attachmentMimeType || null,
      replyTo: payload.replyTo || payload.reply_to || null,
    });

    if (user.blissId) {
      const delivery = await staffOperationsBridge.ingestIncomingBlissAppMessage({
        sourceMessageId: message.id,
        conversationId: `bliss-app-${conversationId}`,
        conversation_id: conversationId,
        userId: user.blissId,
        sender_id: user.blissId,
        blissId: user.blissId,
        userType: user.role || user.userType || 'Customer',
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: user.phone,
        country: user.country,
        department: conversation.departmentName || payload.department || 'Customer Care',
        message_text: messageText,
        message_type: messageType,
        attachmentUrl: message.attachmentUrl,
        attachmentName: message.attachmentName,
        attachmentMimeType: message.attachmentMimeType,
        jobTitle: user.jobTitle || '',
        destination: user.destination || '',
      });
      if (delivery?.success && this.repository.markMessageDelivered) {
        const receipt = await this.repository.markMessageDelivered(message.id);
        Object.assign(message, receipt);
      }
    }

    if (this.notificationService) {
      await this.notificationService.createNotification({
        type: messageType,
        conversationId,
        recipientId: conversation.userId || user.blissId,
      });
    }

    if (this.socketService) {
      this.socketService.emitConversationUpdate(conversationId, message);
    }

    return { success: true, message };
  }

  async startSupportCall(user, conversationId, callType = 'voice') {
    const type = String(callType).toLowerCase();
    if (!['voice', 'video'].includes(type)) {
      return { success: false, statusCode: 400, message: 'Call type must be voice or video.' };
    }
    const customerUserId = String(user.sub || user.id || '');
    if (!customerUserId) {
      return { success: false, statusCode: 401, message: 'Customer identity is unavailable.' };
    }

    const conversation = await this.repository.getConversation(conversationId);
    if (!conversation) {
      return { success: false, statusCode: 404, message: 'Conversation not found.' };
    }
    if (conversation.userId && conversation.userId !== user.blissId) {
      return { success: false, statusCode: 403, message: 'You are not authorized to call from this conversation.' };
    }
    if (mongoose.connection.readyState !== 1) {
      return { success: false, statusCode: 503, message: 'Support calls are unavailable while the call service is offline.' };
    }

    const appConversationId = String(conversation.id || conversation.conversationId);
    let staffConversation = await StaffConversation.findOne({
      blissAppConversationId: appConversationId,
    });
    if (!staffConversation) {
      const profile = await BlissCommunicationUser.findOne({ blissId: user.blissId })
        .select('fullName email phone country userType')
        .lean();
      const staffConversationId = `bliss-app-${appConversationId}`;
      staffConversation = await StaffConversation.findOneAndUpdate(
        { conversationId: staffConversationId },
        {
          $setOnInsert: {
            conversationId: staffConversationId,
            blissAppConversationId: appConversationId,
            customerName: profile?.fullName || user.fullName || 'Bliss App User',
            customerEmail: profile?.email || user.email || '',
            customerPhone: profile?.phone || user.phone || '',
            blissId: user.blissId || '',
            userType: profile?.userType || user.role || 'Customer',
            country: profile?.country || user.country || '',
            department: conversation.departmentName || 'Customer Care',
            queueType: 'Unclassified',
            queueName: 'Unclassified',
            status: 'Open',
            priority: 'Normal',
            unreadCount: 0,
            lastMessage: conversation.lastMessage || '',
            channels: ['bliss_app'],
          },
        },
        { new: true, upsert: true },
      );
    }
    if (staffConversation.activeCall?.status === 'ringing') {
      return { success: false, statusCode: 409, message: 'A support call is already ringing for this conversation.' };
    }

    const assignedTo = String(staffConversation.assignedTo || '').trim();
    let staffAccounts = assignedTo
      ? await Staff.find({
          $or: [{ email: assignedTo }, { fullName: assignedTo }],
          isActive: { $ne: false },
        }).select('email').lean()
      : [];
    if (!staffAccounts.length) {
      staffAccounts = await Staff.find({
        department: staffConversation.department || 'Customer Care',
        isActive: { $ne: false },
      }).select('email').lean();
    }
    const recipients = [...new Set(
      staffAccounts
        .map((staff) => String(staff.email || '').trim().toLowerCase())
        .filter(Boolean),
    )];
    if (!recipients.length) {
      return { success: false, statusCode: 503, message: 'No support staff are currently available for calls.' };
    }

    const channelName = `bliss_support_${crypto.randomUUID().replace(/-/g, '')}`;
    const customerUid = crypto.randomInt(1, 2147483647);
    let staffUid = crypto.randomInt(1, 2147483647);
    if (staffUid === customerUid) staffUid = staffUid === 2147483647 ? 1 : staffUid + 1;
    const [customerRtc, staffRtc] = await Promise.all([
      generateRtcSession({ channelName, uid: customerUid, interviewType: type }),
      generateRtcSession({ channelName, uid: staffUid, interviewType: type }),
    ]);

    const callId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    staffConversation.activeCall = {
      callId,
      candidateUserId: customerUserId,
      status: 'ringing',
      callType: type,
      channelName,
      createdAt,
    };
    await staffConversation.save();

    const call = {
      callId,
      conversationId: staffConversation.conversationId,
      candidateUserId: customerUserId,
      customerName: staffConversation.customerName,
      callType: type,
      videoEnabled: type === 'video',
      channelName: staffRtc.channelName,
      appId: staffRtc.appId,
      token: staffRtc.token,
      uid: staffRtc.uid,
      createdAt,
    };
    const notificationResults = await Promise.allSettled([
      StaffNotification.create({
        title: `Incoming ${type} call`,
        body: `${staffConversation.customerName} is calling Bliss support.`,
        type: 'call',
        conversationId: staffConversation.conversationId,
      }),
      ...recipients.map(async (recipient) => {
        emitToUser(recipient, 'incomingCall', call);
        await Notification.create({
          notificationId: `CALL-${callId}-${recipient}`,
          userId: recipient,
          userType: 'staff',
          title: `Incoming ${type} call`,
          message: `${staffConversation.customerName} is calling Bliss support.`,
          notificationType: 'support_call',
          category: 'message',
          entityType: 'conversation',
          entityId: staffConversation.conversationId,
        });
      }),
    ]);
    for (const result of notificationResults) {
      if (result.status === 'rejected') {
        console.error('Support call notification failed:', result.reason?.message || result.reason);
      }
    }

    return {
      success: true,
      data: {
        callId,
        conversationId: staffConversation.conversationId,
        callType: type,
        videoEnabled: type === 'video',
        channelName: customerRtc.channelName,
        appId: customerRtc.appId,
        token: customerRtc.token,
        uid: customerRtc.uid,
      },
    };
  }

  async endSupportCall(user, conversationId, callId) {
    if (!callId) {
      return { success: false, statusCode: 400, message: 'A callId is required.' };
    }
    const customerUserId = String(user.sub || user.id || '');
    if (!customerUserId) {
      return { success: false, statusCode: 401, message: 'Customer identity is unavailable.' };
    }
    const conversation = await this.repository.getConversation(conversationId);
    if (!conversation || (conversation.userId && conversation.userId !== user.blissId)) {
      return { success: false, statusCode: 404, message: 'Support conversation not found.' };
    }
    if (mongoose.connection.readyState !== 1) {
      return { success: false, statusCode: 503, message: 'Support call service is unavailable.' };
    }

    const staffConversation = await StaffConversation.findOne({
      blissAppConversationId: String(conversation.id || conversation.conversationId),
      'activeCall.callId': callId,
      'activeCall.candidateUserId': customerUserId,
    });
    if (!staffConversation) {
      return { success: false, statusCode: 404, message: 'Support call not found.' };
    }
    const activeCall = staffConversation.activeCall?.toObject?.() ||
      staffConversation.activeCall ||
      {};
    staffConversation.activeCall = {
      ...activeCall,
      status: 'ended',
      updatedAt: new Date().toISOString(),
    };
    await staffConversation.save();

    const assignedTo = String(staffConversation.assignedTo || '').trim();
    let staffAccounts = assignedTo
      ? await Staff.find({
          $or: [{ email: assignedTo }, { fullName: assignedTo }],
          isActive: { $ne: false },
        }).select('email').lean()
      : [];
    if (!staffAccounts.length) {
      staffAccounts = await Staff.find({
        department: staffConversation.department || 'Customer Care',
        isActive: { $ne: false },
      }).select('email').lean();
    }
    for (const staff of staffAccounts) {
      if (staff.email) {
        emitToUser(String(staff.email).trim().toLowerCase(), 'callStatus', {
          callId,
          conversationId: staffConversation.conversationId,
          status: 'ended',
        });
      }
    }
    return { success: true, data: staffConversation.activeCall };
  }

  async markMessageRead(user, messageId) {
    const result = await this.repository.markMessageRead(messageId, user.blissId);
    return { success: true, result };
  }

  async starMessage(user, messageId) {
    const result = await this.repository.starMessage(messageId, user.blissId);
    return { success: true, result };
  }

  async pinMessage(user, messageId) {
    const result = await this.repository.pinMessage(messageId, user.blissId);
    return { success: true, result };
  }

  async archiveConversation(user, conversationId) {
    const result = await this.repository.archiveConversation(conversationId, user.blissId);
    return { success: true, result };
  }

  async deleteMessage(user, messageId) {
    const result = await this.repository.deleteMessage(messageId, user.blissId);
    return { success: true, result };
  }

  async editMessage(user, messageId, text) {
    const result = await this.repository.editMessage(messageId, user.blissId, text);
    return { success: true, result };
  }

  async uploadAttachment(user, file) {
    const attachment = await this.repository.uploadAttachment({ ...file, uploadedBy: user.blissId });
    return { success: true, attachment };
  }

  async search(user, query) {
    const conversations = await this.repository.searchConversations(user, query);
    return { success: true, conversations };
  }
}

function normalizeMessageType(messageType, mimeType = '') {
  const type = String(messageType || '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();
  if (mime.startsWith('image/') || type.includes('image')) return 'image';
  if (mime.startsWith('video/') || type.includes('video')) return 'video';
  if (mime.startsWith('audio/') || type.includes('voice') || type.includes('audio')) {
    return 'audio';
  }
  if (
    mime.startsWith('application/') ||
    mime.startsWith('text/') ||
    ['document', 'pdf', 'file'].some((part) => type.includes(part))
  ) {
    return 'document';
  }
  return 'text';
}

module.exports = InboxService;
