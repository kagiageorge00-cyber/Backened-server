const mongoose = require('mongoose');

const travelHolidayBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelUser', index: true },
    packageName: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    travelDate: { type: Date, required: true },
    travelers: { type: Number, default: 1 },
    status: { type: String, default: 'confirmed' },
    depositPaid: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    marginAmount: { type: Number, default: 0 },
    marginPercentage: { type: Number, default: 0 },
    currency: { type: String, default: 'KES' },
    paymentReference: { type: String, default: '' },
    paymentDate: { type: Date },
    paymentDetails: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TravelHolidayBooking || mongoose.model('TravelHolidayBooking', travelHolidayBookingSchema);
