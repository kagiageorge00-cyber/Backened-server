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

  test('falls back to phone when a stale candidate id does not resolve', async () => {
    const candidate = { _id: 'candidate-for-phone' };
    const Candidate = {
      findOne: jest.fn((filter) => Promise.resolve(filter.phone ? candidate : null)),
    };

    await expect(findCandidateForPayment(Candidate, {
      candidateId: 'stale-candidate-id',
      phone: '+257 611 66248',
    })).resolves.toBe(candidate);
    expect(Candidate.findOne).toHaveBeenNthCalledWith(1, {
      $or: [
        { candidateId: 'stale-candidate-id' },
        { uniqueCode: 'stale-candidate-id' },
      ],
    });
    expect(Candidate.findOne).toHaveBeenNthCalledWith(2, { phone: '+25761166248' });
  });

  test('prefers the candidate code when payment phone identifies another candidate', async () => {
    const candidateByCode = { _id: 'candidate-by-code' };
    const candidateByPhone = { _id: 'candidate-by-phone' };
    const Candidate = {
      findOne: jest.fn((filter) => Promise.resolve(
        filter.$or ? candidateByCode : candidateByPhone
      )),
    };

    await expect(findCandidateForPayment(Candidate, {
      candidateId: 'CAND-7514',
      phone: '+257 611 66248',
    })).resolves.toBe(candidateByCode);
    expect(Candidate.findOne).toHaveBeenCalledTimes(1);
  });

  test('syncs an approved phone-matched payment to the registered candidate', async () => {
    const payment = {
      _id: 'payment-1',
      candidateId: 'old-candidate-id',
      phone: '25761166248',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const Payment = {
      findOne: jest.fn((filter) => ({
        sort: jest.fn().mockResolvedValue(filter.$or[0].phone ? payment : null),
      })),
    };
    const candidate = {
      _id: 'new-candidate-id',
      candidateId: 'new-candidate-id',
      phone: '25761166248',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const Candidate = {
      findOne: jest.fn((filter) => Promise.resolve(
        filter.phone ? candidate : null
      )),
    };

    await expect(syncApprovedPaymentToCandidate(Candidate, Payment, candidate)).resolves.toBe(true);

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

  test('does not sync an approved payment linked to a different candidate code by phone', async () => {
    const payment = {
      _id: 'payment-for-other-candidate',
      candidateId: 'candidate-A',
      phone: '+254700000000',
      save: jest.fn(),
    };
    const Payment = {
      findOne: jest.fn((filter) => ({
        sort: jest.fn().mockResolvedValue(filter.$or[0].phone ? payment : null),
      })),
    };
    const candidateA = { _id: 'candidate-A' };
    const candidateB = {
      _id: 'candidate-B',
      candidateId: 'candidate-B',
      phone: '+254700000000',
      save: jest.fn(),
    };
    const Candidate = {
      findOne: jest.fn((filter) => Promise.resolve(
        filter.$or[0].candidateId === 'candidate-A' ? candidateA : candidateB
      )),
    };

    await expect(syncApprovedPaymentToCandidate(Candidate, Payment, candidateB)).resolves.toBe(false);
    expect(candidateB.save).not.toHaveBeenCalled();
    expect(payment.save).not.toHaveBeenCalled();
  });
});