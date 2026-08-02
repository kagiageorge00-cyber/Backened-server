const mongoose = require('mongoose');

const travelFlightBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelUser', index: true },
    bookingReference: { type: String, unique: true, index: true },
    airline: { type: String, default: '' },
    flightNumber: { type: String, default: '' },
    originAirport: { type: String, default: '' },
    destinationAirport: { type: String, default: '' },
    departureTime: { type: Date },
    arrivalTime: { type: Date },
    passengerDetails: { type: Object, default: {} },
    cabinClass: { type: String, default: 'economy' },
    baggageAllowance: { type: String, default: '' },
    status: { type: String, default: 'confirmed' },
    paymentStatus: { type: String, default: 'pending' },
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

module.exports = mongoose.models.TravelFlightBooking || mongoose.model('TravelFlightBooking', travelFlightBookingSchema);
