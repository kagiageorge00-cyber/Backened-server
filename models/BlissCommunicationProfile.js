const mongoose = require('mongoose');

const blissCommunicationProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlissCommunicationUser', required: true, unique: true },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlissCommunicationProfile', blissCommunicationProfileSchema);
