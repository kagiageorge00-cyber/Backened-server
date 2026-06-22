const mongoose = require('mongoose');

const employerDocumentSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    label: { type: String, trim: true },
    url: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Uploaded', 'Verified', 'Rejected'],
      default: 'Uploaded',
      trim: true,
    },
  },
  { _id: false }
);

const employerSchema = new mongoose.Schema(
  {
    employerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    employerType: {
      type: String,
      enum: ['individual', 'company'],
      required: true,
      default: 'company',
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      trim: true,
    },
    dob: Date,
    nationality: {
      type: String,
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
    whatsappNumber: {
      type: String,
      trim: true,
      index: true,
    },
    whatsappVerificationCode: String,
    whatsappVerificationExpires: Date,
    country: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    physicalAddress: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    companyRegistrationNumber: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
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
    contactPerson: {
      type: String,
      trim: true,
    },
    contactPersonPosition: {
      type: String,
      trim: true,
    },
    numberOfWorkers: {
      type: Number,
      min: 0,
    },
    jobCategories: {
      type: [String],
      default: [],
    },
    jobDescriptions: {
      type: String,
      trim: true,
    },
    residenceType: {
      type: String,
      trim: true,
    },
    numberOfAdults: {
      type: Number,
      min: 0,
    },
    numberOfChildren: {
      type: Number,
      min: 0,
    },
    agesOfChildren: {
      type: [String],
      default: [],
    },
    elderlyCare: {
      type: Boolean,
      default: false,
    },
    pets: {
      type: Boolean,
      default: false,
    },
    expectedDuties: {
      type: String,
      trim: true,
    },
    workingHours: {
      type: String,
      trim: true,
    },
    daysOff: {
      type: String,
      trim: true,
    },
    accommodationProvided: {
      type: Boolean,
      default: false,
    },
    preferredCandidateLanguage: {
      type: String,
      trim: true,
    },
    preferredCandidateNationality: {
      type: String,
      trim: true,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    whatsappVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: [
        'new_registration',
        'email_verified',
        'phone_verified',
        'documents_submitted',
        'under_review',
        'verified_employer',
        'active_employer',
      ],
      default: 'new_registration',
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'blocked', 'suspended'],
      default: 'pending',
      index: true,
      trim: true,
    },
    documents: {
      type: [employerDocumentSchema],
      default: [],
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    profileCompletion: {
      type: Number,
      default: 0,
    },
    verificationHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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
