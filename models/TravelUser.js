const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const travelUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['customer', 'consultant', 'admin'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    country: { type: String, default: '' },
    nationality: { type: String, default: '' },
  },
  { timestamps: true }
);

travelUserSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

travelUserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

travelUserSchema.methods.generateToken = function generateToken() {
  return jwt.sign(
    { sub: this._id.toString(), role: this.role, email: this.email },
    process.env.JWT_SECRET || 'travel-secret',
    { expiresIn: '7d' }
  );
};

travelUserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isVerified: this.isVerified,
    country: this.country,
    nationality: this.nationality,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.TravelUser || mongoose.model('TravelUser', travelUserSchema);
