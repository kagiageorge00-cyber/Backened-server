const express = require('express');
const request = require('supertest');

jest.mock('../models/TravelUser', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const travelRoutes = require('../routes/travelRoutes');

const app = express();
app.use(express.json());
app.use('/api', travelRoutes);

describe('Travel portal routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register rejects incomplete payloads', async () => {
    const res = await request(app)
      .post('/api/travel/register')
      .send({ name: 'Test User' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
