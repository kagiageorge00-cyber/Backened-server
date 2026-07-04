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
    // STEP 1: Basic Job Details
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String, // Keep for backwards compatibility
      trim: true,
    },
    jobCategory: {
      type: String,
      required: true,
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Internship'],
      required: true,
      index: true,
    },
    industry: {
      type: String,
      required: true,
      index: true,
    },
    position: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    workLocation: {
      type: String,
      enum: ['On-site', 'Remote', 'Hybrid'],
      required: true,
    },
    numberOfVacancies: {
      type: Number,
      required: true,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    expectedStartDate: {
      type: Date,
      required: true,
    },
    
    // STEP 2: Job Description
    jobSummary: {
      type: String,
    },
    keyResponsibilities: [String],
    dailyDuties: [String],
    description: {
      type: String,
      trim: true,
    },
    requiredSkills: [String],
    qualifications: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
    },
    educationLevel: {
      type: String,
      enum: ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Diploma', 'Certificate'],
    },
    languagesRequired: [String],
    preferredNationalities: [String],
    preferredGender: {
      type: String,
      enum: ['Any', 'Male', 'Female'],
      default: 'Any',
    },
    ageRange: {
      min: Number,
      max: Number,
    },
    
    // STEP 3: Salary & Benefits
    salary: {
      type: Number,
      required: true,
      index: true,
    },
    salaryType: {
      type: String,
      enum: ['Monthly', 'Weekly', 'Hourly', 'Annual'],
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    benefits: {
      accommodation: { type: Boolean, default: false },
      transport: { type: Boolean, default: false },
      medicalInsurance: { type: Boolean, default: false },
      meals: { type: Boolean, default: false },
      airTicket: { type: Boolean, default: false },
      visaSponsorship: { type: Boolean, default: false },
    },
    otherBenefits: [String],
    
    // STEP 4: Candidate Requirements
    requirements: {
      passportRequired: { type: Boolean, default: false },
      medicalRequired: { type: Boolean, default: false },
      drivingLicenceRequired: { type: Boolean, default: false },
      policeClearanceRequired: { type: Boolean, default: false },
      availableImmediately: { type: Boolean, default: false },
    },
    experienceLevel: {
      type: String,
      trim: true,
    },
    
    // Employer Information
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
    employerLogo: {
      type: String,
    },
    employerRating: {
      type: Number,
      default: 4.5,
    },
    employerVerified: {
      type: Boolean,
      default: false,
    },
    
    // Job Status & Analytics
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Closed', 'Expired', 'Draft', 'open', 'closed', 'paused'],
      default: 'Draft',
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    shortlistedCount: {
      type: Number,
      default: 0,
    },
    interviewedCount: {
      type: Number,
      default: 0,
    },
    hiredCount: {
      type: Number,
      default: 0,
    },
    
    // Premium Features
    featured: {
      type: Boolean,
      default: false,
    },
    qualityScore: {
      type: Number,
      default: 0,
    }, // 0-100
    
    // Dates
    postedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    publishedAt: Date,
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for marketplace queries
jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ country: 1, city: 1, status: 1 });
jobSchema.index({ jobCategory: 1, status: 1 });
jobSchema.index({ employmentType: 1, status: 1 });
jobSchema.index({ salary: 1, status: 1 });
jobSchema.index({ employerId: 1, status: 1 });

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
