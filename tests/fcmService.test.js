const { buildMessagePayload } = require('../services/fcmService');

describe('FCM message payload', () => {
  it('marks chat notifications as high priority for background delivery', () => {
    const payload = buildMessagePayload({
      token: 'test-token',
      title: 'New message from Support',
      message: 'Please check your inbox.',
    });

    expect(payload.message.android).toMatchObject({
      priority: 'HIGH',
      ttl: '86400s',
    });
    expect(payload.message.apns).toMatchObject({
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default' } },
    });
    expect(payload.message.webpush.headers).toMatchObject({
      Urgency: 'high',
      TTL: '86400',
    });
  });

  it('includes the message text in the notification preview', () => {
    const payload = buildMessagePayload({
      token: 'test-token',
      title: 'New message from Support',
      message: 'Your appointment is confirmed.',
    });

    expect(payload.message.notification.body).toBe(
      'Your appointment is confirmed.',
    );
    expect(payload.message.data.body).toBe('Your appointment is confirmed.');
  });

  it('includes a valid image URL for notification previews', () => {
    const payload = buildMessagePayload({
      token: 'test-token',
      title: 'New photo from Support',
      message: 'Sent you a photo.',
      imageUrl: 'https://cdn.example.test/reply.jpg',
    });

    expect(payload.message.notification.image).toBe(
      'https://cdn.example.test/reply.jpg',
    );
    expect(payload.message.webpush.notification.image).toBe(
      'https://cdn.example.test/reply.jpg',
    );
    expect(payload.message.data.image).toBe(
      'https://cdn.example.test/reply.jpg',
    );
  });

  it('does not pass unsafe attachment URLs as notification images', () => {
    const payload = buildMessagePayload({
      token: 'test-token',
      title: 'New photo from Support',
      message: 'Sent you a photo.',
      imageUrl: 'javascript:alert(1)',
    });

    expect(payload.message.notification.image).toBeUndefined();
    expect(payload.message.webpush.notification.image).toBeUndefined();
    expect(payload.message.data.image).toBeUndefined();
  });
});
