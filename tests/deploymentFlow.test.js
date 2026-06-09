jest.mock('../models/Deployment', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../models/PaymentRecord', () => ({
  create: jest.fn(),
}));

jest.mock('../models/Contract', () => ({
  create: jest.fn(),
}));

const request = require('supertest');
const app = require('../server');
const Deployment = require('../models/Deployment');
const PaymentRecord = require('../models/PaymentRecord');
const Contract = require('../models/Contract');

describe('Deployment flow end to end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates, lists, updates, and pays a deployment successfully', async () => {
    Deployment.create.mockResolvedValue({
      deploymentId: 'DEP-123',
      employerId: 'EMP-1',
      candidateId: 'CAN-1',
      paid: false,
      paymentStatus: 'pending',
    });

    Deployment.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { deploymentId: 'DEP-123', employerId: 'EMP-1', candidateId: 'CAN-1' }
      ])
    });

    Deployment.findOneAndUpdate.mockResolvedValue({
      deploymentId: 'DEP-123',
      employerId: 'EMP-1',
      candidateId: 'CAN-1',
      deploymentStatus: 'active'
    });

    const depRecord = {
      deploymentId: 'DEP-123',
      employerId: 'EMP-1',
      candidateId: 'CAN-1',
      paid: false,
      paymentStatus: 'pending',
      save: jest.fn().mockResolvedValue(true)
    };
    Deployment.findOne.mockResolvedValue(depRecord);
    PaymentRecord.create.mockResolvedValue({ paymentId: 'PAY-123', deploymentId: 'DEP-123' });
    Contract.create.mockResolvedValue({ contractId: 'CTR-123', deploymentId: 'DEP-123' });

    const createRes = await request(app)
      .post('/api/deployments/create')
      .send({ employerId: 'EMP-1', candidateId: 'CAN-1' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.deploymentId).toBe('DEP-123');
    expect(Deployment.create).toHaveBeenCalledWith({ deploymentId: expect.any(String), employerId: 'EMP-1', candidateId: 'CAN-1' });

    const listRes = await request(app)
      .get('/api/deployments/employer/EMP-1');

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data).toHaveLength(1);

    const updateRes = await request(app)
      .patch('/api/deployments/DEP-123/status')
      .send({ deploymentStatus: 'active' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.deploymentStatus).toBe('active');

    const payRes = await request(app)
      .post('/api/deployments/DEP-123/pay')
      .send({ employerId: 'EMP-1', amount: 1200, paymentMethod: 'bank' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.payment).toBeDefined();
    expect(payRes.body.contract).toBeDefined();
    expect(depRecord.save).toHaveBeenCalled();
  });
});
