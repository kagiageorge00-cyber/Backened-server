const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  location: String,
  appointmentDate: Date,
  time: String,
  category: String,
  status: { type: String, default: 'scheduled' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
