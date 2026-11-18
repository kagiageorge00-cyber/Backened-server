const mongoose = require('mongoose');
const {
  buildCandidateQueryForPayment,
  getPaymentIdentityValues,
  findCandidateForPayment,
  syncApprovedPaymentToCandidate,
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

  test('resolves a candidate by payment phone before a stale candidate id', async () => {
    const candidate = { _id: 'candidate-for-phone' };
    const Candidate = {
      findOne: jest.fn().mockResolvedValue(candidate),
    };

    await expect(findCandidateForPayment(Candidate, {
      candidateId: 'stale-candidate-id',
      phone: '+257 611 66248',
    })).resolves.toBe(candidate);
    expect(Candidate.findOne).toHaveBeenCalledWith({ phone: '+25761166248' });
  });

  test('syncs an approved phone-matched payment to the registered candidate', async () => {
    const payment = {
      _id: 'payment-1',
      candidateId: 'old-candidate-id',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const query = {
      sort: jest.fn().mockResolvedValue(payment),
    };
    const Payment = {
      findOne: jest.fn().mockReturnValue(query),
    };
    const candidate = {
      _id: 'new-candidate-id',
      candidateId: 'new-candidate-id',
      phone: '25761166248',
      save: jest.fn().mockResolvedValue(undefined),
    };

    await expect(syncApprovedPaymentToCandidate({}, Payment, candidate)).resolves.toBe(true);

    expect(candidate).toEqual(expect.objectContaining({
      paymentStatus: 'Paid',
      isVerified: true,
      status: 'approved',
      applicationStatus: 'Payment Approved',
      paymentId: payment._id,
    }));
    expect(payment.candidateId).toBe('new-candidate-id');
    expect(candidate.save).toHaveBeenCalledTimes(1);
    expect(payment.save).toHaveBeenCalledTimes(1);
  });
});