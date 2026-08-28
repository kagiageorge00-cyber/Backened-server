require('dotenv').config();

const mongoose = require('mongoose');
const Candidate = require('../models/candidate');
const Payment = require('../models/Payment');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const applyChanges = process.argv.includes('--apply');

function valuesForCandidate(candidate) {
  return [candidate._id.toString(), candidate.candidateId, candidate.uniqueCode, candidate.phone, candidate.email]
    .filter(Boolean)
    .map(String);
}

async function hasPaymentForCandidate(candidate) {
  const identifiers = valuesForCandidate(candidate);
  return Payment.exists({
    $or: [
      { candidateId: { $in: identifiers } },
      { userId: { $in: identifiers } },
      { phone: candidate.phone },
      { 'metadata.email': candidate.email },
    ],
  });
}

function buildPayment(candidate) {
  const transactionId = candidate.transactionId || candidate.paymentReference || `LEGACY-${candidate._id}`;
  const paymentMethod = ['mpesa', 'card', 'visa', 'mastercard', 'cash'].includes(candidate.paymentMethod)
    ? candidate.paymentMethod
    : 'mpesa';

  return {
    candidateId: candidate._id.toString(),
    userId: candidate.phone || candidate.email || candidate.uniqueCode || candidate.candidateId,
    phone: candidate.phone || null,
    transactionId,
    paymentMethod,
    amount: Number.isFinite(Number(candidate.amount)) ? Number(candidate.amount) : 0,
    currency: 'KES',
    status: 'pending',
    metadata: {
      name: candidate.fullName || candidate.name || null,
      email: candidate.email || null,
      phone: candidate.phone || null,
      candidateId: candidate.candidateId || null,
      source: 'candidate-payment-status-backfill',
      requiresAdminEvidenceReview: !candidate.transactionId && !candidate.paymentReference,
    },
  };
}

async function main() {
  if (!mongoUri) throw new Error('MONGO_URI or MONGODB_URI is required');

  await mongoose.connect(mongoUri);
  const candidates = await Candidate.find({
    paymentStatus: { $in: ['Pending', 'pending', 'Unpaid', 'unpaid'] },
  });

  let eligible = 0;
  for (const candidate of candidates) {
    if (await hasPaymentForCandidate(candidate)) continue;

    const paymentData = buildPayment(candidate);
    eligible += 1;
    if (applyChanges) {
      const payment = await Payment.create(paymentData);
      candidate.paymentId = payment._id;
      await candidate.save();
      console.log(`Created ${payment._id} for candidate ${candidate._id}`);
    } else {
      console.log(`Would create payment for candidate ${candidate._id} (${candidate.phone || candidate.email || 'no contact'})`);
    }
  }

  console.log(`${applyChanges ? 'Created' : 'Eligible'} ${eligible} candidate payment record(s).`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });