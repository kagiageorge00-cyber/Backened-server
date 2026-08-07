const axios = require('axios');

const buildPlaceholderToken = ({ interviewId, channelName, uid }) => {
  const suffix = `${interviewId || 'interview'}:${channelName || 'channel'}:${uid || 0}`;
  return `placeholder-${Buffer.from(suffix).toString('base64')}`;
};

async function generateRtcSession({ interviewId, channelName, uid, interviewType }) {
  const normalizedType = String(interviewType || 'video').toLowerCase();
  if (normalizedType === 'text') {
    return { provider: 'none', token: null, channelName, uid };
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return {
      provider: 'placeholder',
      token: buildPlaceholderToken({ interviewId, channelName, uid }),
      channelName,
      uid,
    };
  }

  try {
    const response = await axios.post('https://api.agora.io/v1/apps/' + appId + '/cloud_recording/acquire', {}, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${appId}:${appCertificate}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      provider: 'agora',
      token: response?.data?.rtcToken || response?.data?.token || buildPlaceholderToken({ interviewId, channelName, uid }),
      channelName,
      uid,
    };
  } catch (error) {
    return {
      provider: 'placeholder',
      token: buildPlaceholderToken({ interviewId, channelName, uid }),
      channelName,
      uid,
      error: error.message,
    };
  }
}

module.exports = {
  generateRtcSession,
  buildPlaceholderToken,
};
