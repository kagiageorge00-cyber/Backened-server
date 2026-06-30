const mongoose = require('mongoose');

const whatsappCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  templateName: { type: String, default: '' },
  templateParameters: [{ type: String, trim: true }],
  audienceTags: [{ type: String, trim: true }],
  sendMode: { type: String, enum: ['immediate', 'scheduled'], default: 'immediate' },
  scheduledAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['draft', 'queued', 'running', 'completed', 'paused', 'failed'],
    default: 'draft',
  },
  stats: {
    queued: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
  },
  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

whatsappCampaignSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WhatsAppCampaign', whatsappCampaignSchema);
