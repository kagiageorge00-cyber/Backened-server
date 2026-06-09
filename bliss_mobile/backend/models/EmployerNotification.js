const mongoose = require('mongoose');

const employerNotificationSchema = new mongoose.Schema(
  {
    employerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['welcome', 'candidate', 'interview', 'message', 'info'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
    },
  },
  {
    timestamps: true,
  }
);

const EmployerNotification =
  mongoose.models.EmployerNotification ||
  mongoose.model('EmployerNotification', employerNotificationSchema);

module.exports = EmployerNotification;
