const PushToken = require('../models/PushToken');
const fcmService = require('./fcmService');

async function sendPushForNotification(notification) {
  const isChatNotification = [
    'bliss_app_message',
    'chat_reply',
  ].includes(notification?.notificationType);
  const userIds = [...new Set(
    [notification?.userId, ...(notification?.userIds || [])]
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )];
  if (!userIds.length || !notification?.title || !notification?.message) {
    return { success: false, sent: 0, failed: 0, total: 0, skipped: true };
  }

  const tokens = await PushToken.find({ userId: { $in: userIds } }).select('token').lean();
  if (!tokens.length) {
    if (isChatNotification) {
      console.warn('[FCM] Chat notification has no registered device tokens.', {
        userType: notification.userType || 'unknown',
        notificationType: notification.notificationType,
      });
    }
    return { success: false, sent: 0, failed: 0, total: 0, skipped: true };
  }

  const result = await fcmService.sendToTokens(tokens, {
    title: notification.title,
    message: notification.message,
    imageUrl: notification.imageUrl || '',
    data: {
      notificationId: notification.notificationId || '',
      notificationType: notification.notificationType || '',
      actionUrl: notification.actionUrl || '',
      entityType: notification.entityType || '',
      entityId: notification.entityId || '',
      image: notification.imageUrl || '',
    },
    link: notification.actionUrl || '',
  });

  if (isChatNotification && (result.failed > 0 || result.sent === 0)) {
    console.error('[FCM] Chat notification delivery failed.', {
      userType: notification.userType || 'unknown',
      notificationType: notification.notificationType,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
      errors: result.errors,
    });
  }

  return { ...result, success: result.sent > 0 && result.failed === 0 };
}

async function sendPushForEmployerNotification(notification) {
  return sendPushForNotification({
    userId: notification.employerId,
    userType: 'employer',
    notificationId: notification._id?.toString() || '',
    notificationType: notification.type,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.data?.actionUrl || '',
    entityType: notification.data?.entityType || '',
    entityId: notification.data?.entityId || '',
  });
}

module.exports = { sendPushForNotification, sendPushForEmployerNotification };
