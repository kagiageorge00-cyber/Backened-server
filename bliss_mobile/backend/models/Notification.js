const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userType: { type: String, enum: ['candidate', 'employer', 'admin'], default: 'candidate' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: { type: String },
  category: { 
    type: String, 
    enum: ['payment', 'interview', 'message', 'contract', 'visa', 'ticket', 'deployment', 'support', 'candidate'],
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

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
