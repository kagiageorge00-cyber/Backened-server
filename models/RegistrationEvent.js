const mongoose = require('mongoose');

const registrationEventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  candidateId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.RegistrationEvent || mongoose.model('RegistrationEvent', registrationEventSchema);
