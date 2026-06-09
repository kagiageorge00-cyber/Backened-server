const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema(
  {
    employerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    companyAddress: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Employer = mongoose.models.Employer || mongoose.model('Employer', employerSchema);
module.exports = Employer;
