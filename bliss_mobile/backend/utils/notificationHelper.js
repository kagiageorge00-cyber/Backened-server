const Notification = require('../models/Notification');
const crypto = require('crypto');

async function createNotification({ 
  userId, 
  title, 
  message, 
  type, 
  actionUrl, 
  userType = 'candidate',
  category = 'support',
  entityType,
  entityId,
  candidateName,
  employerName,
  amount,
  currency = 'KES'
}) {
  if (!userId || !title || !message) {
    throw new Error('userId, title and message are required to create a notification');
  }

  const notificationId = `NOT-${Date.now()}-${Math.round(Math.random() * 10000)}`;
  return Notification.create({
    notificationId,
    userId,
    userType,
    title,
    message,
    notificationType: type,
    category,
    actionUrl,
    entityType,
    entityId,
    candidateName,
    employerName,
    amount,
    currency,
  });
}

module.exports = {
  createNotification,
};
