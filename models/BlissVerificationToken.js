const mongoose = require('mongoose');

const blissVerificationTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlissCommunicationUser', required: true },
  token: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['email', 'password-reset'] },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlissVerificationToken', blissVerificationTokenSchema);
