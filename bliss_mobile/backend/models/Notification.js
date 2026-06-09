const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userType: { type: String, enum: ['candidate', 'employer', 'admin'], default: 'candidate' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: { type: String },
  actionUrl: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
