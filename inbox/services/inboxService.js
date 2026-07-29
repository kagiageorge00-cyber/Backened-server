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

    const messages = await this.repository.getMessages(conversationId, pagination);
    return { success: true, messages, pagination: { page: pagination.page || 1, limit: pagination.limit || 50 } };
  }

  async sendMessage(user, conversationId, payload) {
    const conversation = await this.repository.getConversation(conversationId);
    if (!conversation) {
      return { success: false, message: 'Conversation not found.' };
    }

    if (conversation.userId && conversation.userId !== user.blissId) {
      return { success: false, message: 'You are not authorized to send messages in this conversation.' };
    }

    const message = await this.repository.createMessage({
      conversationId,
      senderId: user.blissId,
      ...payload,
    });

    if (this.notificationService) {
      await this.notificationService.createNotification({
        type: payload.messageType || 'text',
        conversationId,
        recipientId: conversation.userId || user.blissId,
      });
    }

    if (this.socketService) {
      this.socketService.emitConversationUpdate(conversationId, message);
    }

    return { success: true, message };
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

module.exports = InboxService;
