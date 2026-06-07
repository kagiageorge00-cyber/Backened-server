const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  participants: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
