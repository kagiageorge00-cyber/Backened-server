const { initializePaymentRetention } = require('../services/paymentRetentionService');

jest.mock('../models/Payment', () => ({
  collection: {
    indexes: jest.fn().mockResolvedValue([
      {
        name: 'createdAt_1',
        key: { createdAt: 1 },
        expireAfterSeconds: 172800,
      },
    ]),
    dropIndex: jest.fn().mockResolvedValue(true),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    createIndex: jest.fn().mockResolvedValue('expiresAt_1'),
  },
}));

jest.mock('../models/PaymentRecord', () => ({
  collection: {
    indexes: jest.fn().mockResolvedValue([
      {
        name: 'expiresAt_1',
        key: { expiresAt: 1 },
        expireAfterSeconds: 172800,
      },
    ]),
    dropIndex: jest.fn().mockResolvedValue(true),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    createIndex: jest.fn().mockResolvedValue('expiresAt_1'),
  },
}));

const Payment = require('../models/Payment');
const PaymentRecord = require('../models/PaymentRecord');

describe('payment retention initialization', () => {
  test('replaces short TTL indexes and retains only unapproved records for 30 days', async () => {
    await initializePaymentRetention();

    expect(Payment.collection.dropIndex).toHaveBeenCalledWith('createdAt_1');
    expect(PaymentRecord.collection.dropIndex).toHaveBeenCalledWith('expiresAt_1');
    expect(Payment.collection.updateMany).toHaveBeenNthCalledWith(
      1,
      {
        status: { $nin: ['approved', 'paid', 'completed'] },
        createdAt: { $type: 'date' },
      },
      [{ $set: { expiresAt: { $add: ['$createdAt', 2592000000] } } }],
    );
    expect(Payment.collection.updateMany).toHaveBeenNthCalledWith(
      2,
      {
        status: { $in: ['approved', 'paid', 'completed'] },
        expiresAt: { $ne: null },
      },
      { $unset: { expiresAt: '' } },
    );
    expect(Payment.collection.createIndex).toHaveBeenCalledWith(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
    expect(PaymentRecord.collection.createIndex).toHaveBeenCalledWith(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
  });
});