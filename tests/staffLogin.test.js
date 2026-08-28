const staffController = require('../controllers/staffController');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Staff login', () => {
  test('logs in with email and password', async () => {
    const response = createResponse();

    await staffController.login(
      { body: { email: ' SUPPORT@blissconnect.com ', password: 'Password123!' } },
      response,
    );

    expect(response.status).not.toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: expect.any(String),
      staff: expect.objectContaining({ email: 'support@blissconnect.com' }),
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
});