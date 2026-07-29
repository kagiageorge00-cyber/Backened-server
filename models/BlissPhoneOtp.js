const mongoose = require('mongoose');

const blissPhoneOtpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlissCommunicationUser', required: true },
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlissPhoneOtp', blissPhoneOtpSchema);
