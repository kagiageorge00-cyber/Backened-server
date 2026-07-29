const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  category: String,
  active: { type: Boolean, default: true },
  expiryDate: Date,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
