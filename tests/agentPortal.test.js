const express = require('express');
const request = require('supertest');

jest.mock('../models/Agent', () => {
  const mockModel = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  });
  return mockModel;
});

const Agent = require('../models/Agent');
const agentRoutes = require('../routes/agents');

const app = express();
app.use(express.json());
app.use('/api/agents', agentRoutes);
app.use('/api/agent', agentRoutes);

describe('Agent portal API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new agent with a generated code and token', async () => {
    Agent.findOne.mockResolvedValue(null);
    Agent.create.mockResolvedValue({
      _id: 'agent-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+254700000000',
      country: 'Kenya',
      agentType: 'candidate',
      agentCode: 'AGT-2026-000001',
      referralCode: 'REF-000001',
      status: 'active',
      wallet: { availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0, withdrawnAmount: 0 },
      commissions: [],
      referrals: [],
      notifications: [],
      save: jest.fn().mockResolvedValue(true),
    });

    const response = await request(app)
      .post('/api/agents/register')
      .send({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+254700000000',
        country: 'Kenya',
        password: 'StrongPass123',
        agentType: 'candidate',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.agent.agentCode).toMatch(/AGT-/);
    expect(response.body.token).toBeTruthy();
  });

  it('supports the singular agent registration endpoint used by legacy clients', async () => {
    Agent.findOne.mockResolvedValue(null);
    Agent.create.mockResolvedValue({
      _id: 'agent-2',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+254700000001',
      agentType: 'employer',
      agentCode: 'AGT-2026-000002',
      referralCode: 'REF-000002',
      status: 'active',
    });

    const response = await request(app)
      .post('/api/agent/register')
      .send({
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+254700000001',
        password: 'StrongPass123',
        agentType: 'employer',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('rejects missing password on login', async () => {
    const response = await request(app)
      .post('/api/agents/login')
      .send({ identifier: 'jane@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
