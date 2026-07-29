const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const blissCommunicationUserSchema = new mongoose.Schema({
  blissId: { type: String, unique: true, index: true },
  candidateId: { type: String, default: null, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  country: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  userType: { type: String, default: 'candidate' },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  profileStatus: { type: String, default: 'active' },
  memberSince: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

blissCommunicationUserSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

blissCommunicationUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('BlissCommunicationUser', blissCommunicationUserSchema);
