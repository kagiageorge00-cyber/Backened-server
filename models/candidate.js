const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  // BASIC INFO
  name: String, // 🔥 match frontend
  email: String,
  phone: { type: String, unique: true },
  country: String,

  // JOB INFO
  jobCategory: String,
  jobType: {
    type: String,
    enum: ["local", "international"],
    default: "local",
  },

  expectedSalary: String,

  skills: String,
  experience: String,

  photoUrl: String,
  videoUrl: String,

  // SYSTEM
  isVerified: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["available", "in_process", "deployed"],
    default: "available",
  },

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