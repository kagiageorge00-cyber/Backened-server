const crypto = require('crypto');
const mongoose = require('mongoose');

class InboxRepository {
  constructor(db = null) {
    this.db = db;
    this.memoryConversations = [];
    this.memoryMessages = [];
  }

  getDatabase() {
    return this.db || (mongoose.connection.readyState === 1 ? mongoose.connection.db : null);
  }

  async listConversations(user, pagination = {}) {
    const database = this.getDatabase();
    const storedConversations = database
      ? await database.collection('inbox_conversations').find({ userId: user?.blissId }).sort({ updatedAt: -1 }).toArray()
      : this.memoryConversations.filter((conversation) => conversation.userId === user?.blissId);
    return [
      {
        id: 'conv-recruitment',
        conversationId: 'conv-recruitment',
        departmentName: 'Recruitment Department',
        departmentId: 'dept-recruitment',
        userId: user?.blissId || 'BLISS-2026-000001',
        unreadCount: 2,
        lastMessage: 'Your interview has been scheduled for tomorrow.',
        updatedAt: new Date().toISOString(),
        priority: 'High',
        status: 'active',
      },
      {
        id: 'conv-visa',
        conversationId: 'conv-visa',
        departmentName: 'Visa Department',
        departmentId: 'dept-visa',
        userId: user?.blissId || 'BLISS-2026-000001',
        unreadCount: 1,
        lastMessage: 'Please upload your medical report.',
        updatedAt: new Date().toISOString(),
        priority: 'Medium',
        status: 'active',
      },
      ...storedConversations.map((conversation) => ({
        ...conversation,
        id: conversation.id || conversation.conversationId,
      })),
    ];
  }

  async getConversation(conversationId) {
    const database = this.getDatabase();
    if (database) {
      const conversation = await database.collection('inbox_conversations').findOne({
        conversationId,
      });
      if (conversation) {
        return { ...conversation, id: conversation.id || conversation.conversationId };
      }
    }
    const storedConversation = this.memoryConversations.find(
      (conversation) => conversation.conversationId === conversationId,
    );
    if (storedConversation) return storedConversation;

    const conversations = {
      'conv-recruitment': {
        id: 'conv-recruitment',
        conversationId: 'conv-recruitment',
        departmentName: 'Recruitment Department',
        departmentId: 'dept-recruitment',
        userId: 'BLISS-2026-000001',
        priority: 'High',
        status: 'active',
      },
      'conv-visa': {
        id: 'conv-visa',
        conversationId: 'conv-visa',
        departmentName: 'Visa Department',
        departmentId: 'dept-visa',
        userId: 'BLISS-2026-000001',
        priority: 'Medium',
        status: 'active',
      },
    };

    return conversations[conversationId] || null;
  }

  async getMessages(conversationId, pagination = {}) {
    const database = this.getDatabase();
    if (database) {
      const conversation = await database.collection('inbox_conversations').findOne({
        conversationId,
      });
      if (conversation) {
        const limit = Math.min(Number(pagination.limit) || 50, 100);
        const page = Math.max(Number(pagination.page) || 1, 1);
        const messages = await database
          .collection('inbox_messages')
          .find({ conversationId })
          .sort({ createdAt: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
        return messages.map((message) => ({
          ...message,
          id: message.id || message._id.toString(),
        }));
      }
    } else if (
      this.memoryConversations.some(
        (conversation) => conversation.conversationId === conversationId,
      )
    ) {
      return this.memoryMessages.filter(
        (message) => message.conversationId === conversationId,
      );
    }

    if (database) {
      const limit = Math.min(Number(pagination.limit) || 50, 100);
      const page = Math.max(Number(pagination.page) || 1, 1);
      const messages = await database
        .collection('inbox_messages')
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      if (messages.length > 0) {
        return messages.map((message) => ({ ...message, id: message.id || message._id.toString() }));
      }
    } else {
      const storedMessages = this.memoryMessages.filter(
        (message) => message.conversationId === conversationId,
      );
      if (storedMessages.length > 0) return storedMessages;
    }

    return [
      {
        id: 'msg-1',
        conversationId,
        senderId: 'recruitment',
        receiverId: 'BLISS-2026-000001',
        messageType: 'text',
        messageText: 'Hello, your interview has been scheduled for tomorrow at 09:00.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        conversationId,
        senderId: 'BLISS-2026-000001',
        receiverId: 'recruitment',
        messageType: 'text',
        messageText: 'Thank you. I will be available.',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async createMessage(payload) {
    const message = {
      ...payload,
      id: `msg-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const database = this.getDatabase();
    if (database) {
      await database.collection('inbox_messages').insertOne({ ...message, _id: message.id });
      await database.collection('inbox_conversations').updateOne(
        { conversationId: payload.conversationId },
        { $set: { lastMessage: message.messageText, updatedAt: message.createdAt } },
      );
    } else {
      this.memoryMessages.push(message);
      const conversation = this.memoryConversations.find(
        (item) => item.conversationId === payload.conversationId,
      );
      if (conversation) {
        conversation.lastMessage = message.messageText;
        conversation.updatedAt = message.createdAt;
      }
    }
    return message;
  }

  async createConversation(user, department = 'Customer Care') {
    const database = this.getDatabase();
    const existing = database
      ? await database.collection('inbox_conversations').findOne({
          userId: user.blissId,
          departmentId: 'dept-customer-care',
          status: 'active',
        })
      : this.memoryConversations.find(
          (conversation) =>
            conversation.userId === user.blissId &&
            conversation.departmentId === 'dept-customer-care' &&
            conversation.status === 'active',
        );
    if (existing) {
      return { ...existing, id: existing.id || existing.conversationId };
    }

    const now = new Date().toISOString();
    const conversationId = `conv-${crypto.randomUUID()}`;
    const conversation = {
      id: conversationId,
      conversationId,
      departmentName: department,
      departmentId: 'dept-customer-care',
      userId: user.blissId,
      unreadCount: 0,
      lastMessage: '',
      updatedAt: now,
      priority: 'Normal',
      status: 'active',
    };
    if (database) {
      await database.collection('inbox_conversations').insertOne({
        ...conversation,
        _id: conversationId,
      });
    } else {
      this.memoryConversations.push(conversation);
    }
    return conversation;
  }

  async markMessageRead(messageId, readerId) {
    return { messageId, readerId };
  }

  async starMessage(messageId, userId) {
    return { messageId, userId };
  }

  async pinMessage(messageId, userId) {
    return { messageId, userId };
  }

  async archiveConversation(conversationId, userId) {
    return { conversationId, userId };
  }

  async deleteMessage(messageId, userId) {
    return { messageId, userId };
  }

  async editMessage(messageId, userId, text) {
    return { messageId, userId, text };
  }

  async uploadAttachment(file) {
    return file;
  }

  async searchConversations(user, query) {
    return [];
  }
}

module.exports = InboxRepository;
