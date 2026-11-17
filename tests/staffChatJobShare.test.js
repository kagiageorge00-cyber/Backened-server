jest.mock('../models/Job', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('../models/StaffConversation', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../models/StaffMessage', () => ({
  create: jest.fn(),
}));
jest.mock('../models/StaffNotification', () => ({
  create: jest.fn(),
}));
jest.mock('../models/Notification', () => ({
  create: jest.fn(),
}));
jest.mock('../services/staffOperationsBridge', () => ({
  ingestIncomingBlissAppMessage: jest.fn(),
  backfillStaffConversationQueues: jest.fn(),
  setCustomerPresence: jest.fn(),
  syncStaffReplyToBlissApp: jest.fn().mockResolvedValue({ success: true }),
}));

const mongoose = require('mongoose');
const Job = require('../models/Job');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const Notification = require('../models/Notification');
const { syncStaffReplyToBlissApp } = require('../services/staffOperationsBridge');
const {
  buildChatJobCard,
  listChatShareableJobs,
  resolveChatAttachmentMimeType,
  sendMessage,
} = require('../controllers/staffController');

describe('staff chat attachment MIME types', () => {
  it.each([
    ['voice.webm', 'audio/webm'],
    ['voice.m4a', 'audio/mp4'],
    ['voice.ogg', 'audio/ogg'],
  ])('recognizes recorded audio %s when multipart MIME is generic', (filename, mimeType) => {
    expect(resolveChatAttachmentMimeType({
      originalname: filename,
      mimetype: 'application/octet-stream',
    })).toBe(mimeType);
  });

  it('preserves a specific non-audio MIME type', () => {
    expect(resolveChatAttachmentMimeType({
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
    })).toBe('image/jpeg');
  });
});

describe('staff chat marketplace job cards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a customer-safe snapshot from an active marketplace job', () => {
    const card = buildChatJobCard({
      jobId: 'JOB-2026-001',
      jobTitle: 'Care Assistant',
      employerName: 'Example Employer',
      city: 'Nairobi',
      country: 'Kenya',
      employmentType: 'Full-time',
      salary: 1200,
      salaryType: 'Monthly',
      currency: 'USD',
      jobSummary: 'Provide care and daily support.',
      requirementsText: 'Relevant experience required.',
      applicationDeadline: '2026-12-01T00:00:00.000Z',
      privateEmployerContact: 'private@example.test',
    });

    expect(card).toEqual({
      jobId: 'JOB-2026-001',
      title: 'Care Assistant',
      employerName: 'Example Employer',
      location: 'Nairobi, Kenya',
      employmentType: 'Full-time',
      salary: 1200,
      salaryType: 'Monthly',
      currency: 'USD',
      summary: 'Provide care and daily support.',
      requirements: 'Relevant experience required.',
      applicationDeadline: '2026-12-01T00:00:00.000Z',
    });
  });

  it('handles a missing or invalid application deadline', () => {
    expect(
      buildChatJobCard({
        jobId: 'JOB-2026-002',
        applicationDeadline: 'not-a-date',
      }).applicationDeadline,
    ).toBeNull();
  });

  it('lists only active job cards for authenticated chat sharing', async () => {
    const previousReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const job = {
      jobId: 'JOB-2026-001',
      jobTitle: 'Care Assistant',
      status: 'Active',
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([job]),
    };
    Job.find.mockReturnValue(query);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    try {
      await listChatShareableJobs({}, res);
    } finally {
      mongoose.connection.readyState = previousReadyState;
    }

    expect(Job.find).toHaveBeenCalledWith({ status: 'Active' });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [expect.objectContaining({ jobId: 'JOB-2026-001' })],
    });
  });

  it('sends an active listing as a job card in a Bliss app conversation', async () => {
    const previousReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const job = {
      jobId: 'JOB-2026-001',
      jobTitle: 'Care Assistant',
      employerName: 'Example Employer',
      city: 'Nairobi',
      country: 'Kenya',
      employmentType: 'Full-time',
      salary: 1200,
      currency: 'USD',
    };
    const conversation = {
      conversationId: 'bliss-app-conversation-1',
      blissAppConversationId: 'conversation-1',
      blissId: 'BLISS-2026-000001',
      lastCustomerActiveAt: new Date().toISOString(),
    };
    Job.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(job),
    });
    StaffConversation.findOne.mockResolvedValue(conversation);
    StaffConversation.findOneAndUpdate.mockResolvedValue(conversation);
    StaffMessage.create.mockImplementation(async (data) => ({
      _id: 'staff-message-1',
      ...data,
    }));
    Notification.create.mockResolvedValue({});
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    try {
      await sendMessage(
        {
          staff: { role: 'admin', fullName: 'Test Staff' },
          body: {
            conversationId: conversation.conversationId,
            jobId: job.jobId,
            text: 'Shared job: Care Assistant',
            channel: 'bliss_app',
          },
        },
        res,
      );
    } finally {
      mongoose.connection.readyState = previousReadyState;
    }

    expect(Job.findOne).toHaveBeenCalledWith({
      jobId: job.jobId,
      status: 'Active',
    });
    expect(StaffMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: conversation.conversationId,
        text: 'Shared job: Care Assistant',
        type: 'job_alert',
        jobData: expect.objectContaining({
          jobId: job.jobId,
          title: 'Care Assistant',
        }),
      }),
    );
    expect(syncStaffReplyToBlissApp).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          type: 'job_alert',
          jobData: expect.objectContaining({ jobId: job.jobId }),
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('lets staff reply to Bliss app conversations outside their department', async () => {
    const previousReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const conversation = {
      conversationId: 'bliss-app-conversation-2',
      blissAppConversationId: 'conversation-2',
      department: 'Customer Care',
      assignedTo: 'other.staff@example.test',
    };
    StaffConversation.findOne.mockImplementation((query) => query.$or
      ? Promise.resolve(null)
      : { lean: jest.fn().mockResolvedValue(conversation) });
    StaffConversation.findOneAndUpdate.mockResolvedValue(conversation);
    StaffMessage.create.mockImplementation(async (data) => ({
      _id: 'staff-message-2',
      ...data,
    }));
    Notification.create.mockResolvedValue({});
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    try {
      await sendMessage(
        {
          staff: {
            role: 'staff',
            department: 'Recruitment',
            email: 'recruiter@example.test',
            fullName: 'Recruiter',
          },
          body: {
            conversationId: conversation.conversationId,
            text: 'I can help with that.',
            channel: 'bliss_app',
          },
        },
        res,
      );
    } finally {
      mongoose.connection.readyState = previousReadyState;
    }

    expect(StaffMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: conversation.conversationId,
        text: 'I can help with that.',
        channel: 'bliss_app',
      }),
    );
    expect(StaffConversation.findOneAndUpdate).toHaveBeenCalledWith(
      { conversationId: conversation.conversationId },
      expect.objectContaining({
        lastMessage: 'I can help with that.',
        lastMessageAt: expect.any(Date),
      }),
      { new: true },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('keeps staff replies restricted for conversations outside the Bliss app', async () => {
    const previousReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const conversation = {
      conversationId: 'legacy-conversation-2',
      department: 'Customer Care',
      assignedTo: 'other.staff@example.test',
    };
    StaffConversation.findOne.mockImplementation((query) => query.$or
      ? Promise.resolve(null)
      : { lean: jest.fn().mockResolvedValue(conversation) });
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    try {
      await sendMessage(
        {
          staff: { role: 'staff', department: 'Recruitment' },
          body: {
            conversationId: conversation.conversationId,
            text: 'This should not be sent.',
            channel: 'bliss_app',
          },
        },
        res,
      );
    } finally {
      mongoose.connection.readyState = previousReadyState;
    }

    expect(StaffMessage.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
