jest.mock('axios', () => ({
  post: jest.fn(),
}));

const axios = require('axios');
const { generateRtcSession } = require('../services/rtcService');

describe('Interview RTC session generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AGORA_APP_ID;
    delete process.env.AGORA_APP_CERTIFICATE;
  });

  test('uses Agora REST token flow when credentials are configured', async () => {
    process.env.AGORA_APP_ID = 'demo-app-id';
    process.env.AGORA_APP_CERTIFICATE = 'demo-cert';
    axios.post.mockResolvedValue({ data: { rtcToken: 'agora-token-123' } });

    const session = await generateRtcSession({
      interviewId: 'INT-100',
      channelName: 'interview_INT-100',
      uid: 42,
      interviewType: 'video',
    });

    expect(session.provider).toBe('agora');
    expect(session.token).toBe('agora-token-123');
    expect(axios.post).toHaveBeenCalled();
  });

  test('falls back to a local placeholder token when RTC credentials are absent', async () => {
    const session = await generateRtcSession({
      interviewId: 'INT-200',
      channelName: 'interview_INT-200',
      uid: 7,
      interviewType: 'video',
    });

    expect(session.provider).toBe('placeholder');
    expect(session.token).toMatch(/placeholder/);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
