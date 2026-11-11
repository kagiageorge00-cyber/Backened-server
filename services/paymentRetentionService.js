const PAYMENT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

async function ensureRetentionIndex(Model, statusField, approvedStatuses) {
  let indexes = [];
  try {
    indexes = await Model.collection.indexes();
  } catch (error) {
    if (error.code !== 26 && error.codeName !== 'NamespaceNotFound') {
      throw error;
    }
  }

  for (const index of indexes) {
    const isPaymentExpiryIndex =
      index.key?.expiresAt !== undefined || index.key?.createdAt !== undefined;
    if (
      index.expireAfterSeconds !== undefined &&
      isPaymentExpiryIndex &&
      !(index.key.expiresAt !== undefined && index.expireAfterSeconds === 0)
    ) {
      await Model.collection.dropIndex(index.name);
    }
  }

  if (indexes.length > 0) {
    await Model.collection.updateMany(
      {
        [statusField]: { $nin: approvedStatuses },
        createdAt: { $type: 'date' },
      },
      [{ $set: { expiresAt: { $add: ['$createdAt', PAYMENT_RETENTION_MS] } } }],
    );
    await Model.collection.updateMany(
      {
        [statusField]: { $in: approvedStatuses },
        expiresAt: { $ne: null },
      },
      { $unset: { expiresAt: '' } },
    );
  }

  await Model.collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
}

async function initializePaymentRetention() {
  const Payment = require('../models/Payment');
  const PaymentRecord = require('../models/PaymentRecord');

  await ensureRetentionIndex(Payment, 'status', ['approved', 'paid', 'completed']);
  await ensureRetentionIndex(PaymentRecord, 'paymentStatus', ['verified', 'completed']);
}

module.exports = {
  initializePaymentRetention,
};