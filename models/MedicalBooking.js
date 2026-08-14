const mongoose = require('mongoose');

const medicalBookingSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    mpesaReference: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: String,
      enum: ['nairobi', 'eldoret'],
      required: true,
    },
    medicalType: {
      type: String,
      enum: ['employer_request', 'before_travel'],
      required: true,
    },
    amount: {
      type: Number,
      default: 7500,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'mpesa',
      enum: ['mpesa', 'card'],
    },
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'scheduled', 'completed', 'rejected'],
      default: 'pending_approval',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
    },
    approvedBy: {
      type: String,
    },
    scheduledDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    testResults: {
      type: String,
    },
    completionDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for queries
medicalBookingSchema.index({ candidateId: 1, status: 1 });
medicalBookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalBooking', medicalBookingSchema);
