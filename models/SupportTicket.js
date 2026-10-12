const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userType: { type: String, enum: ['employer', 'candidate'], default: 'employer' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'pending', 'closed'], default: 'open' },
  priority: { type: String, default: 'normal' },
  messages: [{
    from: { type: String, enum: ['customer', 'staff'], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
