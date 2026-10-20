const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userType: { type: String, enum: ['candidate', 'employer', 'admin', 'agent', 'staff', 'operator'], default: 'candidate' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: { type: String },
  category: { 
    type: String, 
    enum: ['payment', 'interview', 'message', 'contract', 'visa', 'ticket', 'deployment', 'support', 'candidate', 'registration'],
    default: 'support'
  },
  actionUrl: { type: String },
  entityType: { type: String }, // 'payment', 'candidate', 'interview', etc.
  entityId: { type: String, index: true },
  candidateName: { type: String },
  employerName: { type: String },
  candidateCode: { type: String },
  candidatePassword: { type: String },
  marketplaceLink: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'KES' },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true });

// Keep FCM delivery attached to notification creation so module-specific
// Notification.create() calls cannot silently bypass push delivery.
notificationSchema.post('save', async function sendFcmAfterSave(notification) {
  try {
    const { sendPushForNotification } = require('../services/pushNotificationDelivery');
    notification.$locals.pushDelivery = await sendPushForNotification(notification);
  } catch (error) {
    notification.$locals.pushDelivery = {
      success: false,
      sent: 0,
      failed: 0,
      error: error.message,
    };
    console.error('[FCM] Notification push failed:', error.message);
  }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
