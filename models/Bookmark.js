const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  candidateCode: { type: String },
  fullName: { type: String },
  photoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

bookmarkSchema.index({ employerId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);
