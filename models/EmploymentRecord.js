const mongoose = require('mongoose');

const employmentRecordSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    employerId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    contractId: { type: String, index: true },
    deploymentId: { type: String, index: true },
    jobTitle: String,
    companyName: String,
    workLocation: String,
    country: String,
    city: String,
    salary: Number,
    currency: { type: String, default: 'KES' },
    workingHours: String,
    workingDays: String,
    benefits: String,
    accommodation: String,
    transport: String,
    meals: String,
    leaveDays: Number,
    contractDuration: String,
    probationPeriod: String,
    startDate: Date,
    additionalTerms: String,
    status: {
      type: String,
      enum: [
        'available',
        'interview_scheduled',
        'interview_accepted',
        'interview_completed',
        'reserved',
        'deployment_payment_pending',
        'deployment_payment_completed',
        'contract_generated',
        'contract_signed',
        'employed',
        'contract_active',
      ],
      default: 'available',
      index: true,
    },
    contactUnlocked: { type: Boolean, default: false },
    localDeploymentFeeEmployer: Number,
    localDeploymentFeeCandidate: Number,
    totalDeploymentFee: Number,
    employerPaid: { type: Boolean, default: false },
    payments: [
      {
        paymentId: String,
        amount: Number,
        currency: String,
        provider: String,
        paidAt: Date,
        status: String,
      },
    ],
    activity: [
      {
        type: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.EmploymentRecord || mongoose.model('EmploymentRecord', employmentRecordSchema);
