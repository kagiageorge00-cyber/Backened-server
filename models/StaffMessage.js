const mongoose = require('mongoose');

const staffMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true },
    sender: { type: String, required: true },
    senderName: { type: String, default: '' },
    text: { type: String, default: '' },
    type: { type: String, default: 'text' },
    channel: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    attachmentName: { type: String, default: '' },
    attachmentMimeType: { type: String, default: '' },
    sourceMessageId: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffMessage', staffMessageSchema);
