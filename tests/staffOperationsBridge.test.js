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
    expect(result.message.channel).toBe('bliss_app');
    expect(result.message.text).toBe('I need help with my upcoming visa interview.');
    expect(result.notification.title).toBe('Jane Wanjiku sent a message');
    expect(result.notification.body).toBe(payload.message_text);
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

  test('keeps app and WhatsApp messages in one staff conversation for the same phone', async () => {
    const appConversationId = `app-thread-${Date.now()}`;
    const customerPhone = `+254700${Date.now().toString().slice(-6)}`;
    const appMessage = await ingestIncomingBlissAppMessage({
      sourceMessageId: `app-${Date.now()}`,
      conversationId: `bliss-app-${appConversationId}`,
      userId: 'candidate-unified',
      blissId: `BLISS-${Date.now()}`,
      customerName: 'Customer',
      customerPhone,
      message_text: 'Sent from Bliss',
      channel: 'bliss_app',
    });
    const whatsappMessage = await ingestIncomingBlissAppMessage({
      sourceMessageId: `wa-${Date.now()}`,
      conversationId: `whatsapp-${customerPhone.replace(/\D/g, '')}`,
      customerName: 'Customer',
      customerPhone,
      message_text: 'Sent from WhatsApp',
      message_type: 'text',
      channel: 'whatsapp',
    });

    expect(whatsappMessage.conversationId).toBe(appMessage.conversationId);
    expect(whatsappMessage.message.channel).toBe('whatsapp');
    expect(whatsappMessage.message.senderName).toBe('Customer');
    expect(whatsappMessage.conversation.channels).toEqual(
      expect.arrayContaining(['bliss_app', 'whatsapp']),
    );
    expect(whatsappMessage.conversation.blissAppConversationId).toBe(appConversationId);
  });
});
