jest.mock('../models/Notification', () => ({
  create: jest.fn(),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/Employer', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('../whatsapp', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

jest.mock('../email', () => ({
  sendEmail: jest.fn(),
}));

const Notification = require('../models/Notification');
const Candidate = require('../models/candidate');
const Employer = require('../models/Employer');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

describe('notification recipient lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Candidate.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    Employer.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        employerId: 'EMP-2026-0001',
        phone: '+254700000000',
        email: 'employer@example.com',
      }),
    });
    Notification.create.mockResolvedValue({ $locals: {} });
  });

  test('looks up employer codes without casting them to User candidateId ObjectIds', async () => {
    await createNotification({
      userId: 'EMP-2026-0001',
      title: 'Interview started',
      message: 'Your interview has started.',
      type: 'interview',
      userType: 'employer',
    });

    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ phone: 'EMP-2026-0001' }, { email: 'EMP-2026-0001' }],
    });
    expect(Employer.findOne).toHaveBeenCalledWith({
      $or: [
        { employerId: 'EMP-2026-0001' },
        { email: 'EMP-2026-0001' },
        { phone: 'EMP-2026-0001' },
      ],
    });
    expect(Notification.create).toHaveBeenCalled();
  });
});