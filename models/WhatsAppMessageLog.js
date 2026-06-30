const mongoose = require('mongoose');

const whatsappMessageLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCampaign', default: null },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppContact', default: null },
  phoneNumber: { type: String, required: true, trim: true, index: true },
  direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
  messageType: { type: String, default: 'text' },
  content: { type: String, default: '' },
  providerMessageId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'received', 'replied', 'opted_out'],
    default: 'queued',
  },
  error: { type: String, default: '' },
  eventType: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('WhatsAppMessageLog', whatsappMessageLogSchema);
