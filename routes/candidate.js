const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: { type: String, unique: true },
  country: String,

  skills: String,
  experience: String,

  photoUrl: String,
  videoUrl: String,

  // 🔥 NEW SYSTEM
  isVerified: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["available", "in_process", "deployed"],
    default: "available",
  },

  // 🔥 OPTIONAL (for tracking)
  paymentStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Candidate", candidateSchema);