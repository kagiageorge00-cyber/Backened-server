const mongoose = require('mongoose');

const travelVisaApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelUser', index: true },
    fullName: { type: String, required: true, trim: true },
    passportNumber: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },
    countryOfResidence: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    visaType: { type: String, required: true, trim: true },
    destinationCountry: { type: String, required: true, trim: true },
    travelPurpose: { type: String, default: '' },
    travelDate: { type: Date },
    returnDate: { type: Date },
    occupation: { type: String, default: '' },
    employer: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, default: 'submitted' },
    applicationNumber: { type: String, unique: true, index: true },
    fee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TravelVisaApplication || mongoose.model('TravelVisaApplication', travelVisaApplicationSchema);
