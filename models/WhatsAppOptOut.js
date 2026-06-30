const mongoose = require('mongoose');

/**
 * WhatsApp Opt-Out Registry
 * Tracks opted-out contacts and their reasons
 */
const whatsappOptOutSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppContact', default: null },
  phoneNumber: { type: String, required: true, trim: true, unique: true, index: true },
  fullName: { type: String, trim: true, default: '' },
  
  // Opt-out details
  optOutReason: {
    type: String,
    enum: ['STOP', 'UNSUBSCRIBE', 'REMOVE', 'OPT OUT', 'NO JOBS', 'MANUAL', 'ABUSE', 'OTHER'],
    required: true,
  },
  optOutMessage: { type: String, default: '' },
  optOutDetectionMethod: {
    type: String,
    enum: ['automatic', 'manual', 'api'],
    default: 'automatic',
  },
  
  // Related campaign
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCampaign', default: null },
  lastContactAttempt: { type: Date, default: null },
  
  // Metadata
  source: { type: String, default: 'webhook' },
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  
  // Timestamps
  optedOutAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes
whatsappOptOutSchema.index({ phoneNumber: 1 });
whatsappOptOutSchema.index({ optOutReason: 1 });
whatsappOptOutSchema.index({ optedOutAt: -1 });

// Auto-update timestamp
whatsappOptOutSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WhatsAppOptOut', whatsappOptOutSchema);
