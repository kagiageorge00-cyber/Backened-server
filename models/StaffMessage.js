const mongoose = require('mongoose');

const staffMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String, default: '' },
    type: { type: String, default: 'text' },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffMessage', staffMessageSchema);
