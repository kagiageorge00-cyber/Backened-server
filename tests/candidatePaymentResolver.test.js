const mongoose = require('mongoose');
const {
  buildCandidateQueryForPayment,
  getPaymentIdentityValues,
} = require('../utils/candidatePaymentResolver');

describe('candidate payment resolver', () => {
  test('matches a payment stored with the candidate Mongo id', () => {
    const candidateObjectId = new mongoose.Types.ObjectId().toString();
    const query = buildCandidateQueryForPayment({ candidateId: candidateObjectId });

    expect(query.$or).toContainEqual({ _id: { $in: [candidateObjectId] } });
  });

  test('uses legacy payment identities as fallbacks', () => {
    expect(getPaymentIdentityValues({
      candidateId: 'CAND-123',
      userId: '+254700000000',
      metadata: { email: 'candidate@example.com' },
    })).toEqual(['CAND-123', '+254700000000', 'candidate@example.com']);
  });
});