const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  airline: { type: String, trim: true },
  departureDate: { type: Date },
  arrivalDate: { type: Date },
  fileUrl: { type: String },
  uploadedBy: { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
