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
    if (!user?.blissId) return [];
    const database = this.getDatabase();
    const storedConversations = database
      ? await database.collection('inbox_conversations').find({ userId: user?.blissId }).sort({ updatedAt: -1 }).toArray()
      : this.memoryConversations.filter((conversation) => conversation.userId === user?.blissId);
    return storedConversations.map((conversation) => ({
      ...conversation,
      id: conversation.id || conversation.conversationId,
    }));
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
    return storedConversation || null;
  }

  async getMessages(conversationId, pagination = {}) {
    const limit = Math.min(Math.max(Number(pagination.limit) || 50, 1), 100);
    const page = Math.max(Number(pagination.page) || 1, 1);
    const database = this.getDatabase();
    if (database) {
      const conversation = await database.collection('inbox_conversations').findOne({
        conversationId,
      });
      if (!conversation) {
        return { messages: [], pagination: { page, limit, total: 0, hasMore: false } };
      }

      const filter = { conversationId };
      const [total, messages] = await Promise.all([
        database.collection('inbox_messages').countDocuments(filter),
        database
          .collection('inbox_messages')
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
      ]);
      const orderedMessages = messages.reverse().map((message) => ({
        ...message,
        id: message.id || message._id.toString(),
      }));
      return {
        messages: orderedMessages,
        pagination: { page, limit, total, hasMore: page * limit < total },
      };
    }

    const conversation = this.memoryConversations.find(
      (item) => item.conversationId === conversationId,
    );
    if (!conversation) {
      return { messages: [], pagination: { page, limit, total: 0, hasMore: false } };
    }

    const allMessages = this.memoryMessages
      .filter((message) => message.conversationId === conversationId)
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    const total = allMessages.length;
    const endIndex = Math.max(0, total - (page - 1) * limit);
    const startIndex = Math.max(0, endIndex - limit);
    return {
      messages: allMessages.slice(startIndex, endIndex),
      pagination: { page, limit, total, hasMore: startIndex > 0 },
    };
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

  async markMessageDelivered(messageId) {
    const deliveredAt = new Date().toISOString();
    const database = this.getDatabase();
    if (database) {
      await database.collection('inbox_messages').updateOne(
        { id: messageId },
        { $set: { delivered: true, deliveredAt } },
      );
    }
    const message = this.memoryMessages.find((item) => item.id === messageId);
    if (message) Object.assign(message, { delivered: true, deliveredAt });
    return { messageId, delivered: true, deliveredAt };
  }

  async markMessageRead(messageId, readerId) {
    const readAt = new Date().toISOString();
    const database = this.getDatabase();
    let updated = false;
    if (database) {
      const result = await database.collection('inbox_messages').updateOne(
        { id: messageId, receiverId: readerId },
        { $set: { read: true, readAt, read_by: readerId } },
      );
      const matched = result.matchedCount > 0;
      updated = result.modifiedCount > 0;
      if (matched && messageId.startsWith('staff-reply-')) {
        await database.collection('staff_messages').updateOne(
          { _id: messageId.substring('staff-reply-'.length) },
          { $set: { read: true, readAt } },
        );
      }
    }
    const message = this.memoryMessages.find(
      (item) => item.id === messageId && item.receiverId === readerId,
    );
    if (message) {
      Object.assign(message, { read: true, readAt, read_by: readerId });
      updated = true;
    }
    return { messageId, readerId, read: updated, readAt: updated ? readAt : null };
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
