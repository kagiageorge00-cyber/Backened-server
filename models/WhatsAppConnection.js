const mongoose = require('mongoose');

const whatsappConnectionSchema = new mongoose.Schema({
  businessId: { type: String, required: true, index: true },
  displayName: { type: String },
  wabaId: { type: String, required: true, index: true },
  phoneNumberId: { type: String },
  phoneNumber: { type: String },
  accessToken: { type: String, required: true },
  status: { type: String, default: 'connected' },
  webhookSubscribed: { type: Boolean, default: false },
  lastSyncedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

whatsappConnectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WhatsAppConnection', whatsappConnectionSchema);
