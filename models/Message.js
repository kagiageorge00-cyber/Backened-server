const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  senderType: { type: String, enum: ['employer', 'candidate'], default: 'employer' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readStatus: { type: String, enum: ['unread', 'read'], default: 'unread' },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, readStatus: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
