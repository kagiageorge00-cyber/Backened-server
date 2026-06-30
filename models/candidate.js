const mongoose = require('mongoose');


const candidateSchema = new mongoose.Schema({
  // ===== IDENTITY =====
  name: String,
  fullName: String,
  email: String,
  phone: { type: String, unique: true },
  uniqueCode: {
    type: String,
    unique: true,
    index: true,
  },
  password: String,
  candidateId: {
    type: String,
    unique: false,
    index: true,
    default: null,
  },

  // ===== PERSONAL INFORMATION =====
  country: String,
  nationality: String,
  gender: String,
  dateOfBirth: String,
  religion: String,
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
  },
  numberOfChildren: Number,

  // ===== EDUCATION & PROFESSIONAL =====
  education: String,
  educationalLevel: {
    type: String,
    enum: ['Primary', 'Secondary', 'Vocational/Technical', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'],
  },
  experience: String,
  skills: [String],
  languages: [String],
  idNumber: String,
  county: String,

  // ===== JOB PREFERENCES =====
  jobPosition: String,
  jobType: String,
  jobAppliedFor: String,
  destinationCountry: String,
  destinationPreference: [String],
  expectedSalary: String,

  // ===== APPLICATION METADATA =====
  appliedJobId: String,
  appliedJobTitle: String,
  appliedEmployerId: String,
  appliedEmployerName: String,

  // ===== DOCUMENTS & MEDIA =====
  photoUrl: String,
  videoUrl: String,
  passportUrl: String,
  medicalUrl: String,
  resumeUrl: String,
  additionalUrl: String,
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

  // ===== STATUS & VERIFICATION =====
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['available', 'in_process', 'deployed', 'approved', 'rejected'],
    default: 'available',
  },
  currentStatus: {
    type: String,
    default: 'Registration',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  profileCompletion: {
    type: Number,
    default: 0,
  },
  contactReleased: {
    type: Boolean,
    default: false,
  },

  // ===== REFERENCES & TIMESTAMPS =====
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  resetToken: String,
  resetTokenExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model('Candidate', candidateSchema)