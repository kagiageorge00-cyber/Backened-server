const staffController = require('../controllers/staffController');
const Job = require('../models/Job');
const JobCommissionMetadata = require('../models/JobCommissionMetadata');

describe('Staff marketplace job posting', () => {
  test('accepts the current staff form payload without required optional fields', async () => {
    const req = {
      body: {
        title: 'Housekeeper',
        jobTitle: 'Housekeeper',
        position: 'Housekeeper',
        country: 'Kenya',
        location: 'Kenya',
        employmentType: 'Full Time',
        description: 'Support daily household operations.',
        images: ['https://example.com/banner.jpg'],
        coverImage: 'https://example.com/banner.jpg',
      },
      protocol: 'https',
      get: () => 'api.example.com',
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await staffController.postMarketplaceJob(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        title: 'Housekeeper',
        workLocation: 'On-site',
        salaryType: 'Annual',
        numberOfVacancies: 1,
        country: 'Kenya',
      }),
    }));

    const postedJob = res.json.mock.calls[0][0].data;
    await expect(new Job(postedJob).validate()).resolves.toBeUndefined();
  });

  test('keeps internal commissions outside public job documents', async () => {
    expect(Job.schema.path('internalCommissionRate')).toBeUndefined();
    expect(Job.schema.path('internalCommissionAmount')).toBeUndefined();
    expect(
      JobCommissionMetadata.schema.path('commissionRate').options.select,
    ).toBe(false);
    expect(
      JobCommissionMetadata.schema.path('commissionAmount').options.select,
    ).toBe(false);

    await expect(
      new JobCommissionMetadata({
        jobId: 'JOB-2026-TEST01',
        commissionRate: 20,
        commissionAmount: 6200,
        currency: 'KES',
      }).validate(),
    ).resolves.toBeUndefined();
  });
});
