const mongoose = require('mongoose');

const interviewMeetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true, index: true },
  interviewId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'active', 'ended', 'cancelled'], default: 'scheduled', index: true },
  joinUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.models.InterviewMeeting || mongoose.model('InterviewMeeting', interviewMeetingSchema);
