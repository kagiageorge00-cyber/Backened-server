const mongoose = require('mongoose');

const blissCandidateLinkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlissCommunicationUser', required: true },
  blissId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  candidateCode: { type: String, default: null },
  linkType: { type: String, default: 'candidate' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlissCandidateLink', blissCandidateLinkSchema);
