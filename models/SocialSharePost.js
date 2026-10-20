const mongoose = require('mongoose');

const socialSharePostSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  caption: { type: String, required: true, trim: true, maxlength: 2200 },
  imageUrl: { type: String, required: true, trim: true },
  jobId: { type: String, required: true, trim: true, index: true },
  createdBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.models.SocialSharePost || mongoose.model('SocialSharePost', socialSharePostSchema);
