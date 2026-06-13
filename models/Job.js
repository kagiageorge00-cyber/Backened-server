const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    employerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    employerName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    requirements: {
      type: String,
      trim: true,
    },
    experienceLevel: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'paused'],
      default: 'open',
      index: true,
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
