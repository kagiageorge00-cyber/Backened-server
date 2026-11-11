const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const blissCommunicationUserSchema = new mongoose.Schema({
  blissId: { type: String, unique: true, index: true },
  candidateId: { type: String, default: null, index: true },
  legacyBlissAppId: { type: String, unique: true, sparse: true },
  legacyPasswordHash: { type: String, select: false },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  whatsapp: { type: String, default: '', trim: true },
  location: { type: String, default: '', trim: true },
  country: { type: String, required: true, trim: true },
  services: { type: [String], default: [] },
  termsAccepted: { type: Boolean, default: false },
  termsVersion: { type: String, default: '' },
  termsAcceptedAt: { type: Date, default: null },
  notificationsConsent: { type: Boolean, default: false },
  notificationsConsentAt: { type: Date, default: null },
  notificationChannels: { type: [String], default: [] },
  marketingConsent: { type: Boolean, default: false },
  marketingConsentAt: { type: Date, default: null },
  password: { type: String, required: true },
  authProvider: { type: String, default: 'password' },
  userType: { type: String, default: 'candidate' },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  whatsappVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  profileStatus: { type: String, default: 'active' },
  memberSince: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

blissCommunicationUserSchema.pre('save', async function () {
  this.updatedAt = new Date();
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

blissCommunicationUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('BlissCommunicationUser', blissCommunicationUserSchema);
