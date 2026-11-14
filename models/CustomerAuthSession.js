const mongoose = require('mongoose');

const customerAuthSessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, default: 'customer' },
    lastUsedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.CustomerAuthSession ||
  mongoose.model('CustomerAuthSession', customerAuthSessionSchema);
