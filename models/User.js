const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: String,
  name: String,
  email: String,
  userType: { type: String, default: "general" },
  status: { type: String, default: "available" },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

 const User = mongoose.models.User || mongoose.model("User", userSchema);

 module.exports = User;
