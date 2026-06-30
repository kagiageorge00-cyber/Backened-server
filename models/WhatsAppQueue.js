const mongoose = require('mongoose');

/**
 * WhatsApp Message Queue Schema
 * Tracks messages in the queue system
 */
const whatsappQueueSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCampaign', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppContact', required: true },
  phoneNumber: { type: String, required: true, trim: true, index: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'template', 'media'], default: 'text' },
  templateName: { type: String, default: '' },
  templateParams: [{ type: String }],
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video', 'document', 'audio'], default: '' },
  
  // Queue status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'skipped'],
    default: 'pending',
    index: true,
  },
  
  // Retry mechanism
  retryCount: { type: Number, default: 0, max: 3 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  
  // Meta information
  providerMessageId: { type: String, default: '' },
  jobId: { type: String, default: '' },
  priority: { type: Number, default: 0 },
  
  // Timestamps
  queuedAt: { type: Date, default: Date.now },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  failedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for efficient querying
whatsappQueueSchema.index({ campaignId: 1, status: 1 });
whatsappQueueSchema.index({ contactId: 1, status: 1 });
whatsappQueueSchema.index({ phoneNumber: 1, status: 1 });
whatsappQueueSchema.index({ status: 1, nextRetryAt: 1 });
whatsappQueueSchema.index({ createdAt: -1 });

// Auto-update timestamp
whatsappQueueSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WhatsAppQueue', whatsappQueueSchema);
