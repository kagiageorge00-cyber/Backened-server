const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidateId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  jobId: { type: String },
  jobTitle: { type: String },
  country: { type: String },
  status: {
    type: String,
    enum: ['Submitted','Under Review','Shortlisted','Interview Requested','Interview Scheduled','Passed','Failed','Deployment Started','Deployed'],
    default: 'Submitted',
  },
  interviewId: { type: String, default: null },
  deploymentId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
