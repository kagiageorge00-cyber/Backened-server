const InboxService = require('../inbox/services/inboxService');

describe('InboxService', () => {
  it('returns conversations for an authorized user', async () => {
    const repo = {
      listConversations: jest.fn().mockResolvedValue([
        { id: 'conv-1', departmentName: 'Recruitment Department', unreadCount: 2, lastMessage: 'Your interview is ready.' },
      ]),
      getConversation: jest.fn(),
      getMessages: jest.fn(),
      createMessage: jest.fn(),
      markMessageRead: jest.fn(),
      starMessage: jest.fn(),
      pinMessage: jest.fn(),
      archiveConversation: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      uploadAttachment: jest.fn(),
      searchConversations: jest.fn(),
    };

    const service = new InboxService(repo, { createNotification: jest.fn() }, { emitConversationUpdate: jest.fn() });

    const result = await service.getConversations({ blissId: 'BLISS-2026-000001', role: 'candidate' }, { page: 1, limit: 20 });

    expect(result.success).toBe(true);
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].unreadCount).toBe(2);
  });

  it('blocks unauthorized access to another user conversation', async () => {
    const repo = {
      getConversation: jest.fn().mockResolvedValue({ id: 'conv-1', userId: 'other-user', departmentName: 'Recruitment Department' }),
    };

    const service = new InboxService(repo, { createNotification: jest.fn() }, { emitConversationUpdate: jest.fn() });

    const result = await service.getConversationDetails({ blissId: 'BLISS-2026-000001', role: 'candidate' }, 'conv-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not authorized/i);
  });
});
