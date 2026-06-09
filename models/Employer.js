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
    companyLogo: {
      type: String,
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
    address: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'blocked', 'suspended'],
      default: 'pending',
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    forgotPasswordToken: String,
    forgotPasswordExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

const Employer = mongoose.models.Employer || mongoose.model('Employer', employerSchema);
module.exports = Employer;
