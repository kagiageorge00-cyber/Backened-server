const mongoose = require('mongoose');

const staffConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    blissId: { type: String, default: '' },
    userType: { type: String, default: 'Candidate' },
    country: { type: String, default: 'Kenya' },
    status: { type: String, default: 'Open' },
    priority: { type: String, default: 'Normal' },
    assignedTo: { type: String, default: '' },
    department: { type: String, default: 'Customer Care' },
    unreadCount: { type: Number, default: 0 },
    lastMessage: { type: String, default: 'No messages yet' },
    lastActive: { type: String, default: 'Just now' },
    notes: [{ type: String }],
    online: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffConversation', staffConversationSchema);
