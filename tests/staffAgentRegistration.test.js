jest.mock('../models/Agent', () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
}));

const Agent = require('../models/Agent');
const staffController = require('../controllers/staffController');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Staff agent registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('persists an agent account and excludes password from response', async () => {
    Agent.findOne.mockResolvedValue(null);
    Agent.countDocuments.mockResolvedValue(0);
    Agent.create.mockResolvedValue({
      toObject: () => ({
        fullName: 'Jane Agent',
        email: 'jane@example.com',
        phone: '+254700000000',
        password: 'hashed-password',
        temporaryPassword: 'one-time-password',
        agentType: 'candidate',
        agentCode: 'AGT-2026-000001',
      }),
    });
    const response = createResponse();

    await staffController.registerAgent({
      body: {
        fullName: 'Jane Agent',
        email: 'JANE@example.com',
        phone: '+254700000000',
        country: 'Kenya',
        password: 'StrongPass123',
        agentType: 'candidate',
      },
    }, response);

    expect(Agent.create).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Jane Agent',
      email: 'jane@example.com',
      phone: '+254700000000',
      password: 'StrongPass123',
      agentType: 'candidate',
      agentCode: 'AGT-2026-000001',
      status: 'active',
    }));
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: expect.not.objectContaining({
        password: expect.anything(),
        temporaryPassword: expect.anything(),
      }),
    });
  });

  test('rejects invalid agent types before creating an account', async () => {
    const response = createResponse();

    await staffController.registerAgent({
      body: {
        fullName: 'Jane Agent',
        email: 'jane@example.com',
        phone: '+254700000000',
        password: 'StrongPass123',
        agentType: 'recruitment',
      },
    }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(Agent.create).not.toHaveBeenCalled();
  });
});
