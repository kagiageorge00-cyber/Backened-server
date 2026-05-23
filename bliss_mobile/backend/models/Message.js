const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  message: { type: String, required: true },
  userType: { type: String, enum: ['candidate', 'employer', 'agent', 'general'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
