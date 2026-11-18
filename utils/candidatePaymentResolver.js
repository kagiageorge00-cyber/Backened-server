const mongoose = require('mongoose');

function uniqueValues(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== '').map(String))];
}

function getPaymentIdentityValues(payment) {
  return uniqueValues([
    payment?.candidateId,
    payment?.userId,
    payment?.phone,
    payment?.metadata?.candidateId,
    payment?.metadata?.phone,
    payment?.metadata?.email,
  ]);
}

function buildCandidateQueryForPayments(payments) {
  const identifiers = uniqueValues(payments.flatMap(getPaymentIdentityValues));
  const objectIds = identifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));

  return {
    $or: [
      ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
      { candidateId: { $in: identifiers } },
      { uniqueCode: { $in: identifiers } },
      { phone: { $in: identifiers } },
      { email: { $in: identifiers } },
    ],
  };
}

function buildCandidateQueryForPayment(payment) {
  return buildCandidateQueryForPayments([payment]);
}

function getPhoneValues(values) {
  const phones = [];
  for (const value of uniqueValues(values)) {
    const compact = value.replace(/[^\d+]/g, '');
    const digits = compact.replace(/\D/g, '');
    phones.push(compact, digits);
    if (digits) phones.push(`+${digits}`);
  }
  return uniqueValues(phones);
}

async function findCandidateForPayment(Candidate, payment) {
  const phoneValues = getPhoneValues([
    payment?.phone,
    payment?.metadata?.phone,
    payment?.userId,
  ]);
  for (const phone of phoneValues) {
    const candidate = await Candidate.findOne({ phone });
    if (candidate) return candidate;
  }

  const identifiers = uniqueValues([
    payment?.candidateId,
    payment?.metadata?.candidateId,
  ]);
  for (const identifier of identifiers) {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const byId = await Candidate.findById(identifier);
      if (byId) return byId;
    }

    const candidate = await Candidate.findOne({
      $or: [{ candidateId: identifier }, { uniqueCode: identifier }],
    });
    if (candidate) return candidate;
  }

  const emails = uniqueValues([payment?.metadata?.email]);
  if (emails.length) {
    const candidates = await Candidate.find({ email: { $in: emails } }).limit(2);
    if (candidates.length === 1) return candidates[0];
  }

  return null;
}

async function syncApprovedPaymentToCandidate(Candidate, Payment, candidate) {
  if (!candidate?.phone) return false;

  const phoneValues = getPhoneValues([candidate.phone]);
  const findLatestPayment = async (filter) => {
    const query = Payment.findOne(filter);
    return typeof query.sort === 'function'
      ? query.sort({ approvedAt: -1, createdAt: -1 })
      : query;
  };
  let payment = await findLatestPayment({
    status: { $in: ['approved', 'paid', 'completed'] },
    $or: [
      { phone: { $in: phoneValues } },
      { 'metadata.phone': { $in: phoneValues } },
    ],
  });

  if (!payment) {
    const identifiers = uniqueValues([
      candidate._id?.toString(),
      candidate.candidateId,
      candidate.uniqueCode,
    ]);
    if (identifiers.length) {
      payment = await findLatestPayment({
        status: { $in: ['approved', 'paid', 'completed'] },
        $or: [
          { candidateId: { $in: identifiers } },
          { 'metadata.candidateId': { $in: identifiers } },
        ],
      });
    }
  }

  if (!payment) return false;

  candidate.paymentStatus = 'Paid';
  candidate.isVerified = true;
  candidate.status = 'approved';
  candidate.applicationStatus = 'Payment Approved';
  candidate.paymentId = payment._id;
  await candidate.save();

  if (String(payment.candidateId || '') !== String(candidate.candidateId || candidate._id)) {
    payment.candidateId = candidate.candidateId || candidate._id.toString();
    await payment.save();
  }

  return true;
}

module.exports = {
  buildCandidateQueryForPayments,
  buildCandidateQueryForPayment,
  findCandidateForPayment,
  getPaymentIdentityValues,
  syncApprovedPaymentToCandidate,
};