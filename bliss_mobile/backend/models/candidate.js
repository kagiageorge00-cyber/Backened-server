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
  status: {
    type: String,
    enum: ['available', 'in_process', 'deployed'],
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
});

module.exports = mongoose.model('Candidate', candidateSchema);