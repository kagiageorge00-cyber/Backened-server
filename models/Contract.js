const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    contractId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    deploymentId: {
      type: String,
      required: true,
      index: true,
    },
    employerId: {
      type: String,
      required: true,
      index: true,
    },
    candidateId: {
      type: String,
      required: true,
    },
    candidateName: String,
    employerName: String,
    companyName: String,
    jobPosition: String,
    jobDescription: String,
    jobCountry: String,
    salary: Number,
    contractPeriodYears: {
      type: Number,
      default: 2,
    },
    contractStatus: {
      type: String,
      enum: [
        'draft',
        'pending_candidate_signature',
        'pending_employer_signature',
        'pending_manager_signature',
        'signed',
        'verified',
        'active',
      ],
      default: 'draft',
      index: true,
    },
    contractUrl: String,
    candidateSigned: {
      type: Boolean,
      default: false,
    },
    candidateSignatureUrl: String,
    candidateSignedAt: Date,
    employerSigned: {
      type: Boolean,
      default: false,
    },
    employerSignatureUrl: String,
    employerSignedAt: Date,
    managerSigned: {
      type: Boolean,
      default: false,
    },
    managerSignatureUrl: String,
    managerSignedAt: Date,
    verificationNotes: String,
    adminVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    verifiedBy: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
