jest.mock('../models/PushToken', () => ({
  find: jest.fn(),
}));

jest.mock('../services/fcmService', () => ({
  sendToTokens: jest.fn(),
}));

const PushToken = require('../models/PushToken');
const fcmService = require('../services/fcmService');
const { sendPushForNotification } = require('../services/pushNotificationDelivery');

describe('push notification delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports chat pushes as skipped when the recipient has no registered devices', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    PushToken.find.mockReturnValue(query);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const result = await sendPushForNotification({
        userId: 'staff@example.com',
        userType: 'staff',
        notificationType: 'bliss_app_message',
        title: 'Customer sent a message',
        message: 'Hello',
      });

      expect(result).toMatchObject({
        success: false,
        skipped: true,
        sent: 0,
        failed: 0,
        total: 0,
      });
      expect(warn).toHaveBeenCalledWith(
        '[FCM] Chat notification has no registered device tokens.',
        {
          userType: 'staff',
          notificationType: 'bliss_app_message',
        },
      );
      expect(fcmService.sendToTokens).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('sends chat replies to every registered recipient device', async () => {
    const tokens = [{ token: 'device-token-1' }, { token: 'device-token-2' }];
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(tokens),
    };
    PushToken.find.mockReturnValue(query);
    fcmService.sendToTokens.mockResolvedValue({
      sent: 2,
      failed: 0,
      total: 2,
      errors: [],
    });

    const notification = {
      userId: 'BLISS-1',
      userType: 'candidate',
      notificationId: 'chat-reply-1',
      notificationType: 'chat_reply',
      title: 'New message from Support',
      message: 'Please check your inbox.',
      actionUrl: 'https://blissapp.web.app',
      entityType: 'conversation',
      entityId: 'conversation-1',
    };
    const result = await sendPushForNotification(notification);

    expect(PushToken.find).toHaveBeenCalledWith({
      userId: { $in: ['BLISS-1'] },
    });
    expect(fcmService.sendToTokens).toHaveBeenCalledWith(tokens, {
      title: notification.title,
      message: notification.message,
      imageUrl: '',
      data: {
        notificationId: 'chat-reply-1',
        notificationType: 'chat_reply',
        actionUrl: notification.actionUrl,
        entityType: 'conversation',
        entityId: 'conversation-1',
        image: '',
      },
      link: notification.actionUrl,
    });
    expect(result).toMatchObject({
      success: true,
      sent: 2,
      failed: 0,
      total: 2,
    });
  });

  it('logs FCM failures without logging recipient identifiers', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ token: 'device-token-1' }]),
    };
    PushToken.find.mockReturnValue(query);
    fcmService.sendToTokens.mockResolvedValue({
      sent: 0,
      failed: 1,
      total: 1,
      errors: ['SENDER_ID_MISMATCH'],
    });
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const result = await sendPushForNotification({
        userId: 'private-customer-id',
        userType: 'candidate',
        notificationType: 'chat_reply',
        title: 'New message from Support',
        message: 'Please check your inbox.',
      });

      expect(result.success).toBe(false);
      expect(error).toHaveBeenCalledWith(
        '[FCM] Chat notification delivery failed.',
        expect.objectContaining({
          notificationType: 'chat_reply',
          sent: 0,
          failed: 1,
          errors: ['SENDER_ID_MISMATCH'],
        }),
      );
      expect(JSON.stringify(error.mock.calls)).not.toContain('private-customer-id');
    } finally {
      error.mockRestore();
    }
  });
});
