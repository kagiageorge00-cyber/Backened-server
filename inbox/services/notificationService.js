class NotificationService {
  async createNotification(payload) {
    return {
      success: true,
      notification: {
        type: payload.type || 'message',
        conversationId: payload.conversationId,
        recipientId: payload.recipientId,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = NotificationService;
