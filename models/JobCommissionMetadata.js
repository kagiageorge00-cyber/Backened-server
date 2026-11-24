const mongoose = require('mongoose');

const jobCommissionMetadataSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      select: false,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
      select: false,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'job_commission_metadata',
  },
);

module.exports =
  mongoose.models.JobCommissionMetadata ||
  mongoose.model('JobCommissionMetadata', jobCommissionMetadataSchema);
