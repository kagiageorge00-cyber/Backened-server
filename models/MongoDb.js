const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  country: String,

  skills: String,
  experience: String,

  photoUrl: String,

  // ✅ ROLE (move INSIDE schema)
  role: {
    type: String,
    enum: ['candidate', 'agent', 'admin'],
    default: 'candidate',
  },

  paymentStatus: {
    type: String,
    default: "pending", // pending | paid
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Candidate", candidateSchema);