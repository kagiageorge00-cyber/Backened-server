const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    candidateId: {
      type: String,
      required: true,
      index: true,
    },
    employerId: {
      type: String,
      required: true,
      index: true,
    },
    candidateName: {
      type: String,
      trim: true,
    },
    candidateEmail: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Employer Review', 'Shortlisted', 'Interview', 'Medical', 'Visa', 'Flight', 'Deployment', 'Hired', 'Rejected', 'Withdrawn'],
      default: 'Applied',
      index: true,
    },
    coverLetter: String,
    matchScore: {
      type: Number,
      default: 0,
    }, // 0-100
    matchDetails: {
      skillsMatch: Boolean,
      experienceMatch: Boolean,
      countryMatch: Boolean,
      languageMatch: Boolean,
      educationMatch: Boolean,
      certificatesMatch: Boolean,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    viewedAt: Date,
    shortlistedAt: Date,
    interviewAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    notes: String,
    
    // Interview details (if applicable)
    interviewType: {
      type: String,
      enum: ['Video', 'Voice', 'In-Person', 'Phone'],
    },
    interviewDate: Date,
    interviewTime: String,
    interviewStatus: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'],
    },
    interviewOutcome: {
      type: String,
      enum: ['Pass', 'Fail', 'Pending'],
    },
    
    // Medical & Visa tracking
    medicalRequired: Boolean,
    medicalStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Approved', 'Rejected'],
    },
    visaRequired: Boolean,
    visaStatus: {
      type: String,
      enum: ['Pending', 'In Progress', 'Approved', 'Rejected'],
    },
    flightRequired: Boolean,
    flightStatus: {
      type: String,
      enum: ['Pending', 'Booked', 'Completed'],
    },
    deploymentStatus: {
      type: String,
      enum: ['Pending', 'Active', 'Completed'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
jobApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
jobApplicationSchema.index({ employerId: 1, status: 1 });
jobApplicationSchema.index({ candidateId: 1, status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });
jobApplicationSchema.index({ status: 1, appliedAt: -1 });

module.exports = mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);
