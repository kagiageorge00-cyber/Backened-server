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

async function findCandidateForPayment(Candidate, payment) {
  return Candidate.findOne(buildCandidateQueryForPayment(payment));
}

module.exports = {
  buildCandidateQueryForPayments,
  buildCandidateQueryForPayment,
  findCandidateForPayment,
  getPaymentIdentityValues,
};