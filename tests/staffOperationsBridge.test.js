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
});
