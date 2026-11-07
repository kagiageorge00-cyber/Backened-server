const {
  buildConversationId,
  buildMessageId,
  mapConversation,
  mapMessage,
  normalizeIdentifier,
  normalizePhone,
} = require('../utils/blissAppMigration');

describe('Bliss App migration mapping', () => {
  it('creates stable, namespaced ids for legacy conversations and messages', () => {
    expect(
      buildConversationId({ id: 12, conversation_uuid: 'legacy-conversation' }),
    ).toBe('bliss-app-legacy-conversation');
    expect(buildMessageId({ id: 15 })).toBe('bliss-app-msg-15');
  });

  it('maps legacy conversations and messages to the main inbox shape', () => {
    const conversation = mapConversation(
      {
        id: 12,
        department: 'Visa Department',
        user_id: 'source-account',
        unread_messages: 2,
        last_message: 'Upload your document',
        created_at: '2026-07-20T09:00:00Z',
        updated_at: '2026-07-28T09:05:00Z',
      },
      'BLISS-2026-000001',
    );
    const message = mapMessage(
      {
        id: 15,
        conversation_id: 12,
        sender_id: 'source-account',
        receiver_id: 'staff-1',
        message_type: 'Text',
        message_text: 'Upload your document',
        read_at: '2026-07-28T09:06:00Z',
        created_at: '2026-07-28T09:05:00Z',
      },
      conversation.conversationId,
      (id) => (id === 'source-account' ? 'BLISS-2026-000001' : ''),
    );

    expect(conversation.conversationId).toBe('bliss-app-12');
    expect(conversation.userId).toBe('BLISS-2026-000001');
    expect(conversation.unreadCount).toBe(2);
    expect(message.conversationId).toBe(conversation.conversationId);
    expect(message.senderId).toBe('BLISS-2026-000001');
    expect(message.receiverId).toBe('staff-1');
    expect(message.messageText).toBe('Upload your document');
    expect(message.read).toBe(true);
    expect(message.createdAt.toISOString()).toBe('2026-07-28T09:05:00.000Z');
  });

  it('normalizes account lookup identifiers without changing stored source values', () => {
    expect(normalizeIdentifier(' Customer@Example.com ')).toBe(
      'customer@example.com',
    );
    expect(normalizePhone('+233 (20) 123-4567')).toBe('+233201234567');
    expect(normalizePhone('pending-legacy-id')).toBe('pending-legacy-id');
  });

  it('fails fast for legacy records that do not have stable ids', () => {
    expect(() => buildConversationId({})).toThrow(
      'Legacy conversation is missing its identifier.',
    );
    expect(() => buildMessageId({})).toThrow(
      'Legacy message is missing its identifier.',
    );
  });
});
