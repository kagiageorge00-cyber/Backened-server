const mockCampaign = {
  status: 'queued',
  updatedAt: null,
  save: jest.fn().mockResolvedValue(true),
};

const mockFindById = jest.fn().mockResolvedValue(mockCampaign);

jest.mock('../models/WhatsAppCampaign', () => ({
  findById: mockFindById,
}));

const mockRedisSet = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'end',
    connect: jest.fn().mockResolvedValue(undefined),
    set: mockRedisSet,
    on: jest.fn(),
  }));
});

const whatsappCampaignService = require('../services/whatsappCampaignService');

describe('whatsapp campaign service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindById.mockResolvedValue(mockCampaign);
  });

  it('allows launchCampaign to complete when Redis is unavailable', async () => {
    const result = await whatsappCampaignService.launchCampaign('campaign-123');

    expect(result).toEqual({
      campaignId: 'campaign-123',
      status: 'running',
      message: 'Campaign launched successfully',
    });
  });
});
