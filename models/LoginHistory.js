const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: String,
  device: String,
  browser: String,
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
