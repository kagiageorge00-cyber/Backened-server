const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const authenticateStaff = require('../middleware/staffAuth');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('chat authentication in production', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBlissJwtSecret = process.env.BLISS_JWT_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalBlissJwtSecret === undefined) delete process.env.BLISS_JWT_SECRET;
    else process.env.BLISS_JWT_SECRET = originalBlissJwtSecret;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  test('customer auth rejects demo tokens even when its JWT secret is configured', () => {
    process.env.BLISS_JWT_SECRET = 'test-bliss-secret';
    const req = { headers: { authorization: 'Bearer demo-token' } };
    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('customer auth reports missing production secret as unavailable', () => {
    delete process.env.BLISS_JWT_SECRET;
    const req = { headers: { authorization: 'Bearer customer-token' } };
    const res = createResponse();

    authenticateToken(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(503);
  });

  test('staff auth does not accept tokens signed with the development fallback', () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ email: 'staff@example.test' }, 'bliss-staff-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();

    authenticateStaff(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(503);
  });
});
