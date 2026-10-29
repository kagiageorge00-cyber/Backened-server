const mongoose = require('mongoose');

const staffConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    blissId: { type: String, default: '' },
    userType: { type: String, default: 'Unknown' },
    country: { type: String, default: '' },
    status: { type: String, default: 'Open' },
    priority: { type: String, default: 'Normal' },
    assignedTo: { type: String, default: '' },
    department: { type: String, default: 'Customer Care' },
    queueType: { type: String, default: 'Unclassified', index: true },
    queueName: { type: String, default: '', index: true },
    jobTitle: { type: String, default: '' },
    destination: { type: String, default: '' },
    unreadCount: { type: Number, default: 0 },
    lastMessage: { type: String, default: 'No messages yet' },
    lastActive: { type: String, default: 'Just now' },
    notes: [{ type: String }],
    nextFollowUpAt: { type: Date, default: null, index: true },
    followUpNote: { type: String, default: '' },
    online: { type: Boolean, default: true },
    lastCustomerActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffConversation', staffConversationSchema);
