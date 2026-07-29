const DashboardService = require('../dashboard/services/dashboardService');
const DashboardRepository = require('../dashboard/repositories/dashboardRepository');

describe('dashboard service', () => {
  it('builds a dashboard payload shape for an authenticated user', async () => {
    const repository = new DashboardRepository({
      userModel: { findById: () => Promise.resolve({
        _id: '123',
        blissId: 'BLISS-2026-000001',
        candidateId: 'CAND-2026-004512',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+254712345678',
        country: 'Kenya',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      }) },
      applicationModel: { find: () => Promise.resolve([]) },
      jobApplicationModel: { find: () => Promise.resolve([]) },
      messageModel: { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) },
      notificationModel: { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) },
      interviewModel: { find: () => ({ sort: () => Promise.resolve([]) }) },
      visaModel: { find: () => ({ sort: () => Promise.resolve([]) }) },
      announcementModel: { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) },
      appointmentModel: { find: () => ({ sort: () => Promise.resolve([]) }) },
    });

    const service = new DashboardService(repository);
    const payload = await service.buildDashboard({ sub: '000000000000000000000000' });
    expect(payload).toHaveProperty('profile');
    expect(payload).toHaveProperty('statistics');
    expect(payload).toHaveProperty('messages');
    expect(payload).toHaveProperty('nextAction');
  });
});
