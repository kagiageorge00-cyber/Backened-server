const InboxService = require('../inbox/services/inboxService');
const staffOperationsBridge = require('../services/staffOperationsBridge');

describe('InboxService', () => {
  it('creates a personalized support welcome when a customer starts a service enquiry', async () => {
    const repository = {
      createConversation: jest.fn().mockResolvedValue({
        id: 'conv-1',
        departmentId: 'dept-customer-care',
      }),
      createMessage: jest.fn().mockResolvedValue({ id: 'message-1' }),
    };
    const service = new InboxService(repository);

    await service.createConversation(
      { blissId: 'BLISS-2026-000001', fullName: 'Ada Lovelace' },
      { department: 'Customer Care', serviceInterest: 'Visa processing' },
    );

    expect(repository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        senderType: 'support',
        receiverId: 'BLISS-2026-000001',
        messageText: expect.stringContaining(
          'Hi Ada! Thanks for enquiring about Visa processing.',
        ),
      }),
    );
  });

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

  it('forwards customer attachment metadata to the staff inbox', async () => {
    const message = {
      id: 'message-attachment-1',
      attachmentUrl: 'https://res.cloudinary.com/bliss/video/upload/intro.mp4',
      attachmentName: 'intro.mp4',
      attachmentMimeType: 'video/mp4',
    };
    const repository = {
      getConversation: jest.fn().mockResolvedValue({
        id: 'conv-attachment-1',
        userId: 'BLISS-2026-000001',
        departmentId: 'dept-customer-care',
        departmentName: 'Customer Care',
      }),
      createMessage: jest.fn().mockResolvedValue(message),
      markMessageDelivered: jest.fn().mockResolvedValue({
        messageId: message.id,
        delivered: true,
        deliveredAt: '2026-10-25T00:00:00.000Z',
      }),
    };
    const deliverToStaff = jest
      .spyOn(staffOperationsBridge, 'ingestIncomingBlissAppMessage')
      .mockResolvedValue({ success: true });

    try {
      const service = new InboxService(repository);
      await service.sendMessage(
        {
          blissId: 'BLISS-2026-000001',
          fullName: 'Customer',
          email: 'customer@example.com',
        },
        'conv-attachment-1',
        {
          message_text: 'Shared intro.mp4',
          message_type: 'Video',
          attachment_url: message.attachmentUrl,
          attachment_name: message.attachmentName,
          attachment_mime_type: message.attachmentMimeType,
        },
      );

      expect(repository.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'video',
          attachmentUrl: message.attachmentUrl,
          attachmentName: message.attachmentName,
          attachmentMimeType: message.attachmentMimeType,
        }),
      );
      expect(deliverToStaff).toHaveBeenCalledWith(
        expect.objectContaining({
          message_type: 'video',
          attachmentUrl: message.attachmentUrl,
          attachmentName: message.attachmentName,
          attachmentMimeType: message.attachmentMimeType,
        }),
      );
      expect(repository.markMessageDelivered).toHaveBeenCalledWith(message.id);
    } finally {
      deliverToStaff.mockRestore();
    }
  });
});
