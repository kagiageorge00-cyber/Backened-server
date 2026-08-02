const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema({
  userId: String,
  userType: String,
  token: String,
  platform: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.PushToken || mongoose.model('PushToken', pushTokenSchema);
