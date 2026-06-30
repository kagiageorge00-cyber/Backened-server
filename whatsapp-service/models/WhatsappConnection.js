const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  businessId: { type: String, required: true },
  displayName: { type: String },
  wabaId: { type: String, required: true, index: true },
  phoneNumberId: { type: String, required: true },
  phoneNumber: { type: String },
  accessToken: { type: String, required: true }, // encrypted
  status: { type: String, default: 'disconnected' },
  webhookSubscribed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

Schema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('WhatsappConnection', Schema);
