const mongoose = require('mongoose');

const officeVisitBookingSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    email: String,
    preferredDate: String,
    preferredTime: String,
    purpose: String,
    createdAt: String,
    status: {
      type: String,
      default: 'pending',
    },
  },
  { timestamps: true }
);

const OfficeVisitBooking = mongoose.models.OfficeVisitBooking || mongoose.model('OfficeVisitBooking', officeVisitBookingSchema);

async function createOfficeVisitBooking(payload) {
  const booking = await OfficeVisitBooking.create(payload);
  return booking;
}

async function getOfficeVisitBookings() {
  const bookings = await OfficeVisitBooking.find({}).sort({ createdAt: -1, updatedAt: -1 }).lean();
  return bookings.map((booking) => ({
    ...booking,
    id: booking._id.toString(),
  }));
}

module.exports = {
  OfficeVisitBooking,
  createOfficeVisitBooking,
  getOfficeVisitBookings,
};
