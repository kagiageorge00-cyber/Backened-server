const mongoose = require('mongoose');

const whatsappContactSchema = new mongoose.Schema({
  fullName: { type: String, trim: true, default: '' },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true,
    unique: true,
  },
  source: { type: String, default: 'manual' },
  tags: [{ type: String, trim: true }],
  optedIn: { type: Boolean, default: true },
  optedOut: { type: Boolean, default: false },
  lastMessageSentAt: { type: Date, default: null },
  lastReplyAt: { type: Date, default: null },
  lastReplyText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

whatsappContactSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  this.phoneNumber = (this.phoneNumber || '').trim();
  next();
});

module.exports = mongoose.model('WhatsAppContact', whatsappContactSchema);
