const { identifyLoginMethod, buildBlissId } = require('../auth/services/authService');
const {
  compareAndUpgradeLegacyPassword,
  isValidBlissAppPasswordHash,
  verifyBlissAppPassword,
} = require('../auth/services/authService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const CustomerUser = require('../models/BlissCommunicationUser');
const {
  buildUserPayload,
  validateCustomerProfile,
} = require('../auth/controllers/authController');

describe('auth service helpers', () => {
  it('detects bliss ids, candidate ids, emails and phone numbers', () => {
    expect(identifyLoginMethod('BLISS-2026-000001')).toBe('bliss_id');
    expect(identifyLoginMethod('CAND-2026-004512')).toBe('candidate_id');
    expect(identifyLoginMethod('john@example.com')).toBe('email');
    expect(identifyLoginMethod('+254712345678')).toBe('phone');
  });

  it('builds a bliss id in the expected format', () => {
    const value = buildBlissId(2026, 1);
    expect(value).toBe('BLISS-2026-000001');
  });

  it('allows registration without selecting services and still completes the profile', () => {
    const validation = validateCustomerProfile({
      fullName: 'Test Customer',
      location: 'Nairobi, Kenya',
      phone: '+254700000000',
      whatsapp: '+254700000001',
      email: 'customer@example.test',
      services: [],
      termsAccepted: true,
    });

    expect(validation.isValid).toBe(true);
    expect(validation.profile.services).toEqual([]);
    expect(
      buildUserPayload({
        ...validation.profile,
        _id: { toString: () => 'customer-1' },
        blissId: 'BLISS-2026-000001',
        termsAccepted: true,
      }),
    ).toMatchObject({
      profileComplete: true,
      services: [],
      marketingConsent: false,
      notificationsConsent: false,
      notificationChannels: [],
    });
  });

  it('records campaign channel consent only when the customer opts in', () => {
    const validation = validateCustomerProfile({
      fullName: 'Test Customer',
      location: 'Nairobi, Kenya',
      phone: '+254700000000',
      whatsapp: '+254700000001',
      email: 'customer@example.test',
      termsAccepted: true,
      notificationsConsent: true,
    });

    expect(validation.isValid).toBe(true);
    expect(
      buildUserPayload({
        ...validation.profile,
        _id: { toString: () => 'customer-1' },
        blissId: 'BLISS-2026-000001',
        termsAccepted: true,
        marketingConsent: true,
      }),
    ).toMatchObject({
      profileComplete: true,
      marketingConsent: true,
      notificationsConsent: true,
      notificationChannels: ['whatsapp', 'email', 'in_app', 'fcm'],
    });
  });

  it('hashes customer passwords in the Mongoose save hook', async () => {
    const password = 'Secure-Customer-Password1';
    const user = new CustomerUser({
      blissId: 'BLISS-2026-000001',
      fullName: 'Test Customer',
      email: 'customer@example.test',
      phone: '+254700000000',
      country: 'Kenya',
      password,
    });
    const insert = jest
      .spyOn(CustomerUser.collection, 'insertOne')
      .mockResolvedValue({ acknowledged: true, insertedId: user._id });

    try {
      await user.save();
    } finally {
      insert.mockRestore();
    }

    expect(user.password).not.toBe(password);
    await expect(bcrypt.compare(password, user.password)).resolves.toBe(true);
  });

  it('verifies Bliss App scrypt hashes and rejects malformed hashes', async () => {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync('migrated-password', salt, 64);
    const hash = `${salt}:${derivedKey.toString('hex')}`;

    expect(isValidBlissAppPasswordHash(hash)).toBe(true);
    await expect(verifyBlissAppPassword('migrated-password', hash)).resolves.toBe(true);
    await expect(verifyBlissAppPassword('wrong-password', hash)).resolves.toBe(false);
    await expect(verifyBlissAppPassword('migrated-password', 'malformed')).resolves.toBe(false);
  });

  it('upgrades a valid legacy password after successful verification', async () => {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync('migrated-password', salt, 64);
    const user = {
      password: await bcrypt.hash('unrelated-password', 4),
      legacyPasswordHash: `${salt}:${derivedKey.toString('hex')}`,
      save: jest.fn().mockResolvedValue(undefined),
    };

    await expect(
      compareAndUpgradeLegacyPassword(user, 'migrated-password'),
    ).resolves.toBe(true);
    expect(user.password).toBe('migrated-password');
    expect(user.legacyPasswordHash).toBeUndefined();
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it('does not upgrade a legacy password when verification fails', async () => {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync('migrated-password', salt, 64);
    const legacyPasswordHash = `${salt}:${derivedKey.toString('hex')}`;
    const user = {
      password: await bcrypt.hash('unrelated-password', 4),
      legacyPasswordHash,
      save: jest.fn(),
    };

    await expect(
      compareAndUpgradeLegacyPassword(user, 'wrong-password'),
    ).resolves.toBe(false);
    expect(user.legacyPasswordHash).toBe(legacyPasswordHash);
    expect(user.save).not.toHaveBeenCalled();
  });
});
