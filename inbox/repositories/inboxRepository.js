class InboxRepository {
  constructor(db = null) {
    this.db = db;
  }

  async listConversations(user, pagination = {}) {
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
    ];
  }

  async getConversation(conversationId) {
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
    return payload;
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
