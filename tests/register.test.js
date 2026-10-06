jest.mock('../models/Payment', () => ({
  findOne: jest.fn().mockResolvedValue({
    userId: '254700000001',
    amount: 1000,
    title: 'Test registration payment',
    intentId: 'INT_TEST_001',
    status: 'completed',
  }),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({
    _id: 'cand_123',
    fullName: 'Test User',
    email: 'test@test.com',
    phone: '254700000001',
    uniqueCode: 'BLISS-123456',
    candidateId: 'cand_123',
  }),
}));

jest.mock('../services/notificationservice', () => ({
  notifyRegistrationSuccess: jest.fn(async () => true),
  notifyMarketplaceListing: jest.fn(async () => true),
}));

jest.mock('../utils/adminNotificationHelper', () => ({
  notifyCandidateRegistered: jest.fn(async () => true),
}));

const request = require('supertest');
const app = require('../app'); // adjust path
const Candidate = require('../models/candidate');
const bcrypt = require('bcryptjs');
const { notifyRegistrationSuccess, notifyMarketplaceListing } = require('../services/notificationservice');

describe('User Registration', () => {
  it('should register a user', async () => {

    const res = await request(app)
      .post('/api/candidate/register')
      .send({
        fullName: 'Test User',
        email: 'test@test.com',
        phone: '254700000001',
        country: 'Kenya',
        skills: 'Testing',
        experience: '1 year',
      });

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.uniqueCode).toBeDefined();
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(notifyRegistrationSuccess).toHaveBeenCalled();
  }, 20000);

  it('should issue a temporary password when an existing candidate registers documents', async () => {
    const existingCandidate = {
      _id: 'cand_existing',
      fullName: 'Existing User',
      name: 'Existing User',
      email: 'existing@test.com',
      phone: '254700000002',
      uniqueCode: 'CAND-2026-1234',
      password: '$2b$10$existing-hash',
      documents: {},
      skills: [],
      languages: [],
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'Paid',
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(existingCandidate);

    const res = await request(app)
      .post('/api/register')
      .send({
        fullName: 'Existing User',
        email: 'existing@test.com',
        phone: '254700000002',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.uniqueCode).toBe('CAND-2026-1234');
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(existingCandidate.password).not.toBe('$2b$10$existing-hash');
    await expect(bcrypt.compare(res.body.password, existingCandidate.password))
      .resolves.toBe(true);
  });
});