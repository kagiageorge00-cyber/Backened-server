const staffController = require('../controllers/staffController');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Staff login', () => {
  test('logs in with email and password', async () => {
    const accountEmail = `support-${Date.now()}@blissconnect.com`;
    const createAccountResponse = createResponse();
    await staffController.createStaffAccount(
      {
        body: {
          fullName: 'Support Staff',
          email: accountEmail,
          phone: '+254700000000',
          password: 'Password123!',
        },
      },
      createAccountResponse,
    );
    expect(createAccountResponse.status).toHaveBeenCalledWith(201);

    const response = createResponse();

    await staffController.login(
      { body: { email: ` ${accountEmail.toUpperCase()} `, password: 'Password123!' } },
      response,
    );

    expect(response.status).not.toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: expect.any(String),
      staff: expect.objectContaining({ email: accountEmail }),
    }));
  });

  test('rejects a request without email or password', async () => {
    const response = createResponse();

    await staffController.login({ body: { username: 'support@blissconnect.com', password: 'Password123!' } }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: 'email and password are required',
    });
  });

  test('matches MongoDB staff emails case-insensitively and ignores inactive accounts', async () => {
    const previousReadyState = mongoose.connection.readyState;
    const staffRecord = {
      email: 'support@blissconnect.com',
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: () => ({ email: 'support@blissconnect.com', password: 'hashed-password' }),
    };
    const collation = jest.fn().mockResolvedValue(staffRecord);
    const findOne = jest.spyOn(Staff, 'findOne').mockReturnValue({ collation });
    mongoose.connection.readyState = 1;

    try {
      const response = createResponse();
      await staffController.login(
        { body: { email: ' SUPPORT@blissconnect.com ', password: 'Password123!' } },
        response,
      );

      expect(findOne).toHaveBeenCalledWith({
        email: 'support@blissconnect.com',
        isActive: { $ne: false },
      });
      expect(collation).toHaveBeenCalledWith({ locale: 'en', strength: 2 });
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    } finally {
      findOne.mockRestore();
      mongoose.connection.readyState = previousReadyState;
    }
  });
});