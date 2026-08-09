const mongoose = require('mongoose');

function normalizeEnumValue(value, map) {
  if (!value || typeof value !== 'string') return value;
  const key = value.trim().toLowerCase();
  return map[key] || value.trim();
}

const maritalStatusMap = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  separated: 'Separated',
};

const educationalLevelMap = {
  primary: 'Primary',
  secondary: 'Secondary',
  vocational: 'Vocational/Technical',
  'vocational/technical': 'Vocational/Technical',
  technical: 'Vocational/Technical',
  diploma: 'Diploma',
  bachelor: "Bachelor's Degree",
  bachelors: "Bachelor's Degree",
  "bachelor's degree": "Bachelor's Degree",
  'bachelors degree': "Bachelor's Degree",
  master: "Master's Degree",
  masters: "Master's Degree",
  "master's degree": "Master's Degree",
  'masters degree': "Master's Degree",
  phd: 'PhD',
  doctorate: 'PhD',
  other: 'Other',
};

const paymentStatusMap = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  unpaid: 'Unpaid',
};

const candidateSchema = new mongoose.Schema({
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
  country: String,
  nationality: String,
  gender: String,
  dateOfBirth: String,
  religion: String,
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
    set: (v) => normalizeEnumValue(v, maritalStatusMap),
  },
  numberOfChildren: Number,
  education: String,
  educationalLevel: {
    type: String,
    enum: ['Primary', 'Secondary', 'Vocational/Technical', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'],
    set: (v) => normalizeEnumValue(v, educationalLevelMap),
  },
  experience: String,
  skills: [String],
  languages: [String],
  idNumber: String,
  county: String,
  jobPosition: String,
  jobType: String,
  jobAppliedFor: String,
  destinationCountry: String,
  destinationPreference: [String],
  expectedSalary: String,
  appliedJobId: String,
  appliedJobTitle: String,
  appliedEmployerId: String,
  appliedEmployerName: String,
  photoUrl: String,
  videoUrl: String,
  passportUrl: String,
  medicalUrl: String,
  resumeUrl: String,
  additionalUrl: String,
  goodConductUrl: String,
  introductionVideoUrl: String,
  otherDocumentUrl: String,
  nationalIdFrontUrl: String,
  nationalIdBackUrl: String,
  candidateFormLink: String,
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
  applicationStatus: {
    type: String,
    default: 'Pending Payment',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Unpaid'],
    default: 'Pending',
    set: (v) => normalizeEnumValue(v, paymentStatusMap),
  },
  paymentReference: String,
  paymentMethod: String,
  paymentDate: Date,
  transactionId: String,
  amount: Number,
  profileCompletion: {
    type: Number,
    default: 0,
  },
  contactReleased: {
    type: Boolean,
    default: false,
  },
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

module.exports = mongoose.model('Candidate', candidateSchema);