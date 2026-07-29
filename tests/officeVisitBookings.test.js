const request = require('supertest');

jest.mock('../services/officeVisitBookingService', () => ({
  createOfficeVisitBooking: jest.fn(),
  getOfficeVisitBookings: jest.fn(),
}));

const app = require('../server');
const {
  createOfficeVisitBooking,
  getOfficeVisitBookings,
} = require('../services/officeVisitBookingService');

describe('Office visit bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores a booking through the public booking endpoint', async () => {
    createOfficeVisitBooking.mockResolvedValue({
      _id: 'booking-1',
      fullName: 'Jane Doe',
      phone: '0712345678',
      email: 'jane@example.com',
      preferredDate: '2026-07-30',
      preferredTime: '10:30',
      purpose: 'Interview',
      status: 'pending',
    });

    const response = await request(app)
      .post('/api/office-visit-bookings')
      .send({
        fullName: 'Jane Doe',
        phone: '0712345678',
        email: 'jane@example.com',
        preferredDate: '2026-07-30',
        preferredTime: '10:30',
        purpose: 'Interview',
      });

    expect(response.status).toBe(201);
    expect(createOfficeVisitBooking).toHaveBeenCalled();
    expect(response.body.success).toBe(true);
  });

  it('returns bookings for the admin endpoint', async () => {
    getOfficeVisitBookings.mockResolvedValue([
      {
        _id: 'booking-1',
        fullName: 'Jane Doe',
        preferredDate: '2026-07-30',
        preferredTime: '10:30',
        status: 'pending',
      },
    ]);

    const response = await request(app).get('/api/admin/office-visit-bookings');

    expect(response.status).toBe(200);
    expect(getOfficeVisitBookings).toHaveBeenCalled();
    expect(response.body.success).toBe(true);
    expect(response.body.bookings).toHaveLength(1);
  });
});
