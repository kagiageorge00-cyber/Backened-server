const PushToken = require('../models/PushToken');
const fcmService = require('./fcmService');

async function sendPushForNotification(notification) {
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
    return { success: false, sent: 0, failed: 0, total: 0, skipped: true };
  }

  const result = await fcmService.sendToTokens(tokens, {
    title: notification.title,
    message: notification.message,
    data: {
      notificationId: notification.notificationId || '',
      notificationType: notification.notificationType || '',
      actionUrl: notification.actionUrl || '',
      entityType: notification.entityType || '',
      entityId: notification.entityId || '',
    },
    link: notification.actionUrl || '',
  });

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
