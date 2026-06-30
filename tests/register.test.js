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
    expect(notifyRegistrationSuccess).toHaveBeenCalled();
  }, 20000);
});