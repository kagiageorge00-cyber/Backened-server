const { RtcRole, RtcTokenBuilder } = require('agora-token');

function normalizeInterviewType(interviewType) {
  const normalizedType = String(interviewType || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (['video', 'video_call'].includes(normalizedType)) return 'video';
  if (['voice', 'voice_call', 'audio', 'audio_call', 'phone'].includes(normalizedType)) {
    return 'voice';
  }
  if (['text', 'chat', 'chat_message', 'message'].includes(normalizedType)) {
    return 'text';
  }
  return null;
}

async function generateRtcSession({ channelName, uid, interviewType }) {
  const normalizedType = normalizeInterviewType(interviewType);
  if (!normalizedType) {
    const error = new Error('Unsupported interview type.');
    error.statusCode = 400;
    throw error;
  }
  if (normalizedType === 'text') {
    return { provider: 'none', appId: null, token: null, channelName, uid };
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    const error = new Error(
      'Video interviews are unavailable because Agora is not configured on the server.',
    );
    error.statusCode = 503;
    throw error;
  }

  const tokenExpirationSeconds = 24 * 60 * 60;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    tokenExpirationSeconds,
    tokenExpirationSeconds,
  );

  return { provider: 'agora', appId, token, channelName, uid };
}

module.exports = { generateRtcSession, normalizeInterviewType };
