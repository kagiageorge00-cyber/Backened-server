const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  country: { type: String, default: 'Unknown', trim: true },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  address: { type: String, default: '' },
  nationalId: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  paymentMethod: { type: String, default: 'bank_transfer' },
  bankDetails: { type: Object, default: {} },
  mobileMoney: { type: Object, default: {} },
  password: { type: String, required: true },
  agentType: { type: String, enum: ['candidate', 'employer'], required: true },
  agentCode: { type: String, unique: true, index: true },
  referralCode: { type: String, unique: true, index: true },
  temporaryPassword: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'blacklisted'], default: 'pending' },
  role: { type: String, default: 'agent' },
  wallet: {
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 },
    withdrawnAmount: { type: Number, default: 0 },
    pendingWithdrawals: { type: Number, default: 0 },
    completedWithdrawals: { type: Number, default: 0 },
  },
  commissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AgentCommission' }],
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AgentReferral' }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

agentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

agentSchema.methods.comparePassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
