jest.mock('agora-token', () => ({
  RtcRole: { PUBLISHER: 1 },
  RtcTokenBuilder: {
    buildTokenWithUid: jest.fn(() => 'rtc-token-123'),
  },
}));

const { RtcTokenBuilder } = require('agora-token');
const {
  generateRtcSession,
  normalizeInterviewType,
} = require('../services/rtcService');

describe('Interview RTC session generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AGORA_APP_ID;
    delete process.env.AGORA_APP_CERTIFICATE;
  });

  test.each([
    ['video_call', 'video'],
    ['voice_call', 'voice'],
    ['chat_message', 'text'],
  ])('normalizes portal interview type %s', (input, expected) => {
    expect(normalizeInterviewType(input)).toBe(expected);
  });

  test('builds a publisher RTC token from the configured Agora credentials', async () => {
    process.env.AGORA_APP_ID = 'demo-app-id';
    process.env.AGORA_APP_CERTIFICATE = 'demo-cert';

    const session = await generateRtcSession({
      interviewId: 'INT-100',
      channelName: 'interview_INT-100',
      uid: 42,
      interviewType: 'video',
    });

    expect(session.provider).toBe('agora');
    expect(session.appId).toBe('demo-app-id');
    expect(session.token).toBe('rtc-token-123');
    expect(RtcTokenBuilder.buildTokenWithUid).toHaveBeenCalledWith(
      'demo-app-id',
      'demo-cert',
      'interview_INT-100',
      42,
      1,
      86400,
      86400,
    );
  });

  test('rejects video sessions when Agora credentials are not configured', async () => {
    await expect(generateRtcSession({
      interviewId: 'INT-200',
      channelName: 'interview_INT-200',
      uid: 7,
      interviewType: 'video',
    })).rejects.toMatchObject({ statusCode: 503 });
    expect(RtcTokenBuilder.buildTokenWithUid).not.toHaveBeenCalled();
  });

  test('does not require RTC credentials for text interviews', async () => {
    const session = await generateRtcSession({
      interviewId: 'INT-300',
      channelName: 'interview_INT-300',
      uid: 0,
      interviewType: 'text',
    });

    expect(session).toMatchObject({
      provider: 'none',
      appId: null,
      token: null,
      channelName: 'interview_INT-300',
    });
    expect(RtcTokenBuilder.buildTokenWithUid).not.toHaveBeenCalled();
  });
});
