const { ingestIncomingBlissAppMessage } = require('../services/staffOperationsBridge');

describe('Staff operations app-inbound bridge', () => {
  test('persists an app message into staff conversations and staff notifications', async () => {
    const payload = {
      conversationId: 'bliss-app-conv-001',
      message_text: 'I need help with my upcoming visa interview.',
      message_type: 'Text',
      customerName: 'Jane Wanjiku',
      customerEmail: 'jane@example.com',
      customerPhone: '+254700000111',
      blissId: 'BC-2026-000099',
      userType: 'Candidate',
      country: 'Kenya',
      priority: 'High',
      department: 'Customer Care',
      userId: 'candidate-demo-1',
    };

    const result = await ingestIncomingBlissAppMessage(payload);

    expect(result.success).toBe(true);
    expect(result.conversationId).toBe('bliss-app-conv-001');
    expect(result.message.sender).toBe('customer');
    expect(result.message.text).toBe('I need help with my upcoming visa interview.');
    expect(result.notification.title).toBe('Bliss app message received');
    expect(result.notification.body).toContain('Jane Wanjiku');
  });

  test('does not duplicate staff messages or notifications when a source message is retried', async () => {
    const payload = {
      sourceMessageId: `source-${Date.now()}`,
      conversationId: `conversation-${Date.now()}`,
      message_text: 'A retried message',
      customerName: 'Customer',
    };

    const first = await ingestIncomingBlissAppMessage(payload);
    const second = await ingestIncomingBlissAppMessage(payload);

    expect(first.message.sourceMessageId).toBe(payload.sourceMessageId);
    expect(second.duplicate).toBe(true);
    expect(second.message).toBe(first.message);
    expect(second.notification).toBeNull();
  });
});
