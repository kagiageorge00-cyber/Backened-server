const mongoose = require('mongoose');


const candidateSchema = new mongoose.Schema({
  name: String,
  fullName: String,
  email: String,
  phone: { type: String, unique: true },
  country: String,
  nationality: String,
  skills: [String], // Changed to array for multiple skills
  experience: String,
  photoUrl: String,
  videoUrl: String,
  passportUrl: String,
  medicalUrl: String,
  resumeUrl: String,
  additionalUrl: String,
  gender: String,
  dateOfBirth: String,
  idNumber: String,
  county: String,
  jobAppliedFor: String,
  education: String,
  applicationDate: Date,
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
  },
  documents: {
    passportPhoto: String,
    nationalId: String,
    cv: String,
    certificates: [String],
    coverLetter: String,
    uploads: [
      {
        type: String,
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  uniqueCode: {
    type: String,
    unique: true,
    index: true,
  },
  password: String,
  
  // NEW FIELDS
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
  },
  numberOfChildren: Number,
  religion: String,
  educationalLevel: {
    type: String,
    enum: ['Primary', 'Secondary', 'Vocational/Technical', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'],
  },
  applicationDate: Date,
  
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetToken: String,
  resetTokenExpires: Date,
  status: {
    type: String,
    enum: ['available', 'in_process', 'deployed', 'approved', 'rejected'],
    default: 'available',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  candidateId: {
    type: String,
    unique: false,
    index: true,
    default: null,
  },
  profilePhoto: String,
  languages: [String],
  profileCompletion: {
    type: Number,
    default: 0,
  },
  currentStatus: {
    type: String,
    default: 'Registration',
  },
});


module.exports = mongoose.model('Candidate', candidateSchema)