const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema({
  shortlistId: { type: String, required: true, unique: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.Shortlist || mongoose.model('Shortlist', shortlistSchema);
