const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Customer Care Officer' },
    department: { type: String, default: 'Customer Care' },
    blissId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: '' },
    country: { type: String, default: 'Kenya' },
    online: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

staffSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Staff', staffSchema);
