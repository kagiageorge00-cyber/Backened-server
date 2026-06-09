const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  interviewId: { type: String, required: true, unique: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  interviewDate: { type: Date, required: true },
  interviewTime: { type: String },
  interviewStatus: {
    type: String,
    enum: ['requested', 'accepted', 'declined', 'completed', 'passed', 'failed'],
    default: 'requested',
  },
  meetingLink: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
