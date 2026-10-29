const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const StaffNotification = require('../models/StaffNotification');
const Notification = require('../models/Notification');
const WhatsAppContact = require('../models/WhatsAppContact');
const WhatsAppOptOut = require('../models/WhatsAppOptOut');
const SupportTicket = require('../models/SupportTicket');
const {
  ingestIncomingBlissAppMessage,
  backfillStaffConversationQueues,
  setCustomerPresence,
} = require('../services/staffOperationsBridge');
const { createNotification } = require('../utils/notificationHelper');
const { permissionsFor } = require('../middleware/staffPermissions');
const { sendWhatsAppMessage } = require('../whatsapp');
const { sendPushForNotification } = require('../services/pushNotificationDelivery');
const { sendEmail } = require('../email');

const JWT_SECRET = process.env.JWT_SECRET || 'bliss-staff-secret';
const CUSTOMER_ONLINE_WINDOW_MS = 60 * 1000;

const memoryState = {
  staff: [],
  conversations: [],
  messages: [],
  notifications: [],
  applications: [],
  pendingCandidates: [],
  employers: [],
  agents: [],
  bookings: [],
  supportTickets: [],
  assignments: [],
  jobs: [],
};

function createToken(staff) {
  return jwt.sign(
    {
      sub: staff._id || staff.id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role,
      department: staff.department,
      rank: staff.rank || 'Staff',
      permissions: permissionsFor(staff),
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function canAccessAllStaffChats(staff = {}) {
  return /^(admin|administrator|super admin|system administrator|operations lead|operations manager|supervisor)$/i.test(String(staff.role || '').trim()) ||
    /^(administrator|supervisor)$/i.test(String(staff.rank || '').trim());
}

function staffChatScope(staff = {}) {
  if (canAccessAllStaffChats(staff)) return {};
  const access = [];
  if (staff.department) access.push({ department: staff.department });
  if (staff.sub || staff.email || staff.fullName) {
    access.push({ assignedTo: { $in: [staff.sub, staff.email, staff.fullName].filter(Boolean) } });
  }
  return access.length ? { $or: access } : { conversationId: '__no_staff_chat_access__' };
}

function staffCanAccessConversation(staff = {}, conversation) {
  if (!conversation) return false;
  if (canAccessAllStaffChats(staff)) return true;
  const assigned = [staff.sub, staff.email, staff.fullName].filter(Boolean).map((value) => String(value).toLowerCase());
  return (staff.department && String(conversation.department || '').toLowerCase() === String(staff.department).toLowerCase()) ||
    assigned.includes(String(conversation.assignedTo || '').toLowerCase());
}

function queueForDepartment(department) {
  const queues = {
    Recruitment: 'Candidate Chats',
    'Employer Relations': 'Employer Chats',
    Visa: 'Visa Applications',
    Travel: 'Holiday Chat',
    'Customer Care': 'Unclassified',
  };
  return queues[department] || 'Unclassified';
}

function isQueueAllowedForDepartment(queueType, department) {
  const allowed = {
    Recruitment: ['Candidate Chats'],
    'Employer Relations': ['Employer Chats'],
    Visa: ['Visa Applications'],
    Travel: ['Ticket Booking Chats', 'Holiday Booking Chats', 'Holiday Chat'],
    'Customer Care': ['Unclassified'],
  };
  return (allowed[department] || []).includes(queueType);
}

async function findAccessibleConversation(req, conversationId) {
  if (mongoose.connection.readyState === 1) {
    return StaffConversation.findOne({ conversationId, ...staffChatScope(req.staff) });
  }
  return memoryState.conversations.find((conversation) =>
    conversation.conversationId === conversationId && staffCanAccessConversation(req.staff, conversation)
  ) || null;
}

function isCustomerOnline(conversation, now = Date.now()) {
  const lastActive = Date.parse(conversation?.lastCustomerActiveAt || '');
  return Number.isFinite(lastActive) &&
    now - lastActive <= CUSTOMER_ONLINE_WINDOW_MS;
}

async function notifyCustomerOfOfflineReply(conversation, sender) {
  const deliveries = {
    inApp: { success: false },
    email: { success: false },
    whatsapp: { success: false },
    push: { success: false },
  };
  const title = `New message from ${sender}`;
  const message = 'You have a new message in your Bliss Connect chat. Open the app to read it.';
  const actionUrl = process.env.FRONTEND_URL || 'https://blissconnect12.netlify.app';

  if (mongoose.connection.readyState === 1 && conversation.blissId) {
    try {
      const notification = await Notification.create({
        notificationId: `CHAT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        userId: conversation.blissId,
        userType: 'candidate',
        title,
        message,
        notificationType: 'chat_reply',
        category: 'message',
        actionUrl,
        entityType: 'conversation',
        entityId: conversation.conversationId,
      });
      deliveries.inApp = { success: true };
      deliveries.push = notification.$locals?.pushDelivery || {
        success: false,
        sent: 0,
        failed: 0,
        error: 'Push delivery did not return a result.',
      };
    } catch (error) {
      deliveries.inApp = { success: false, error: error.message };
      deliveries.push = { success: false, error: error.message };
      console.error('Offline chat notification could not be saved:', error.message);
    }
  } else {
    const error = conversation.blissId
      ? 'Notification storage is unavailable.'
      : 'Customer Bliss ID is unavailable.';
    deliveries.inApp = { success: false, error };
    deliveries.push = { success: false, error };
  }

  if (conversation.customerEmail) {
    try {
      const result = await sendEmail({
        to: conversation.customerEmail,
        subject: title,
        text: message,
      });
      deliveries.email = result === false
        ? { success: false, error: 'Email provider did not accept the notification.' }
        : { success: true };
    } catch (error) {
      deliveries.email = { success: false, error: error.message };
      console.error('Offline chat email notification failed:', error.message);
    }
  } else {
    deliveries.email = { success: false, error: 'Customer email is unavailable.' };
  }

  const customerPhone = String(conversation.customerPhone || '').trim();
  if (customerPhone) {
    const phoneDigits = customerPhone.replace(/\D/g, '').replace(/^00/, '');
    const phoneForms = [...new Set([customerPhone, phoneDigits, `+${phoneDigits}`])];
    try {
      const [contact, optedOut] = mongoose.connection.readyState === 1
        ? await Promise.all([
            WhatsAppContact.findOne({
              phoneNumber: { $in: phoneForms },
              optedIn: true,
              optedOut: false,
            }).select('phoneNumber').lean(),
            WhatsAppOptOut.findOne({ phoneNumber: { $in: phoneForms } }).select('_id').lean(),
          ])
        : [null, null];

      if (optedOut) {
        deliveries.whatsapp = { success: false, error: 'Customer has opted out of WhatsApp messages.' };
      } else if (!contact) {
        deliveries.whatsapp = { success: false, error: 'No WhatsApp opt-in contact exists for this number.' };
      } else {
        deliveries.whatsapp = await sendWhatsAppMessage(
          contact.phoneNumber,
          `${title}. ${message}`,
        );
      }
    } catch (error) {
      deliveries.whatsapp = { success: false, error: error.message };
      console.error('Offline chat WhatsApp notification failed:', error.message);
    }
  } else {
    deliveries.whatsapp = { success: false, error: 'Customer phone number is unavailable.' };
  }

  return deliveries;
}

function normalizeWorkLocation(value) {
  if (value == null) return '';
  const normalized = value.toString().trim();
  const lowercased = normalized.toLowerCase();
  if (lowercased === 'remote') return 'Remote';
  if (lowercased === 'hybrid') return 'Hybrid';
  if (lowercased === 'on-site' || lowercased === 'onsite' || lowercased === 'on site') return 'On-site';
  return normalized;
}

function normalizePreferredGender(value) {
  if (value == null) return '';
  const normalized = value.toString().trim();
  const lowercased = normalized.toLowerCase();
  if (lowercased === 'male' || lowercased === 'm') return 'Male';
  if (lowercased === 'female' || lowercased === 'f') return 'Female';
  return normalized;
}

function normalizeEmploymentType(value) {
  if (value == null) return '';
  const normalized = value.toString().trim();
  const lowercased = normalized.toLowerCase();
  if (lowercased === 'full time' || lowercased === 'full-time' || lowercased === 'fulltime') return 'Full Time';
  if (lowercased === 'part time' || lowercased === 'part-time' || lowercased === 'parttime') return 'Part Time';
  if (lowercased === 'contract') return 'Contract';
  if (lowercased === 'temporary') return 'Temporary';
  if (lowercased === 'internship') return 'Internship';
  return normalized;
}

function normalizeSalaryType(value) {
  if (value == null) return '';
  return value.toString().trim();
}

function parseDateOrDefault(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date;
}

async function seedStaffDirectory() {
  if (mongoose.connection.readyState === 1) {
    return Staff.find({ isActive: { $ne: false } }).sort({ createdAt: 1 }).lean();
  }
  return memoryState.staff.filter((item) => item.isActive !== false);
}

async function ensureDemoData() {
  if (mongoose.connection.readyState === 1) return;

  if (memoryState.applications.length === 0) {
    memoryState.applications.push(
      {
        applicationId: 'APP-2026-0001',
        name: 'Amina Yusuf',
        email: 'amina@example.com',
        phone: '+254712345678',
        country: 'Kenya',
        education: 'Diploma in Nursing',
        experience: '2 years in healthcare',
        skills: 'Care, Communication, Teamwork',
        notes: ['Passport pending review'],
        status: 'Review pending',
      },
      {
        applicationId: 'APP-2026-0002',
        name: 'Joseph Kimani',
        email: 'joseph@example.com',
        phone: '+254712345679',
        country: 'Kenya',
        education: 'Certificate in Hospitality',
        experience: '3 years in hotel service',
        skills: 'Guest service, Food safety',
        notes: ['Needs medical clearance'],
        status: 'Awaiting documents',
      },
    );
  }

  if (memoryState.pendingCandidates.length === 0) {
    memoryState.pendingCandidates.push(
      {
        candidateId: 'BC-2026-000002',
        name: 'Amina Yusuf',
        outstanding: [
          'Passport copy missing',
          'Medical report incomplete',
          'Interview availability missing',
        ],
        country: 'Kenya',
      },
      {
        candidateId: 'BC-2026-000003',
        name: 'Joseph K.',
        outstanding: [
          'Preferred job title needs confirmation',
          'Visa application form incomplete',
        ],
        country: 'Uganda',
      },
    );
  }

  if (memoryState.employers.length === 0) {
    memoryState.employers.push(
      {
        employerId: 'EMP-2026-0001',
        name: 'Kilimanjaro Kitchens',
        contactEmail: 'hr@kilimanjaro.co.ke',
        contactPhone: '+254700111222',
        country: 'Kenya',
        status: 'Pending approval',
      },
      {
        employerId: 'EMP-2026-0002',
        name: 'Nile Logistics',
        contactEmail: 'contact@nilelogistics.ug',
        contactPhone: '+256700333444',
        country: 'Uganda',
        status: 'Active',
      },
    );
  }

  if (memoryState.agents.length === 0) {
    memoryState.agents.push(
      {
        agentId: 'AGT-2026-000001',
        name: 'Grace Mugo',
        email: 'grace@blissconnect.com',
        country: 'Kenya',
        agentType: 'Recruitment',
        status: 'Active',
      },
      {
        agentId: 'AGT-2026-000002',
        name: 'Hassan Farah',
        email: 'hassan@blissconnect.com',
        country: 'Somalia',
        agentType: 'Visa support',
        status: 'Active',
      },
    );
  }

  if (memoryState.bookings.length === 0) {
    memoryState.bookings.push(
      {
        bookingId: 'BOOK-001',
        client: 'Nadia M.',
        service: 'Visa consultation',
        schedule: 'Today • 10:30 AM',
        status: 'Confirmed',
      },
      {
        bookingId: 'BOOK-002',
        client: 'Joseph K.',
        service: 'Document review',
        schedule: 'Tomorrow • 2:00 PM',
        status: 'Pending',
      },
      {
        bookingId: 'BOOK-003',
        client: 'Ruth A.',
        service: 'Interview prep',
        schedule: 'Thu • 4:30 PM',
        status: 'Rescheduled',
      },
    );
  }

  if (memoryState.assignments.length === 0) {
    memoryState.assignments.push(
      {
        assignmentId: 'ASG-001',
        title: 'Customer Care Queue',
        detail: '2 open cases need reassignment',
        owner: 'Hannah Maina',
        status: 'Open',
      },
      {
        assignmentId: 'ASG-002',
        title: 'Visa Review',
        detail: 'Pending employer docs',
        owner: 'Daniel Otieno',
        status: 'In progress',
      },
    );
  }

  if (memoryState.jobs.length === 0) {
    memoryState.jobs.push(
      {
        jobId: 'JOB-2026-0001',
        title: 'Healthcare Assistant - Qatar',
        location: 'Qatar',
        status: 'Published',
      },
    );
  }
}

async function listApplications(req, res) {
  try {
    await ensureDemoData();
    return res.json({ success: true, data: memoryState.applications });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateApplication(req, res) {
  try {
    await ensureDemoData();
    const { id } = req.params;
    const application = memoryState.applications.find((item) => item.applicationId === id || item._id === id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    const nextApplication = {
      ...application,
      ...req.body,
      applicationId: application.applicationId || id,
      updatedAt: new Date().toISOString(),
    };
    Object.assign(application, nextApplication);
    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listPendingCandidates(req, res) {
  try {
    await ensureDemoData();
    return res.json({ success: true, data: memoryState.pendingCandidates });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function completeCandidate(req, res) {
  try {
    await ensureDemoData();
    const { id } = req.params;
    const candidate = memoryState.pendingCandidates.find((item) => item.candidateId === id || item._id === id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    candidate.outstanding = [];
    candidate.completedAt = new Date().toISOString();
    candidate.status = 'Completed';
    return res.json({ success: true, data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listEmployers(req, res) {
  try {
    await ensureDemoData();
    const storedEmployers = mongoose.connection.readyState === 1
      ? await Employer.find({})
        .select('-password -whatsappVerificationCode -whatsappVerificationExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationCode -phoneVerificationExpires -forgotPasswordToken -forgotPasswordExpires -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .lean()
      : [];
    const seenEmployers = new Set();
    const employers = [...storedEmployers, ...memoryState.employers]
      .filter((employer) => {
        const key = String(employer.employerId || employer.email || employer._id || '');
        if (!key || seenEmployers.has(key)) return false;
        seenEmployers.add(key);
        return true;
      })
      .map((employer) => Object.fromEntries(
        Object.entries(employer).filter(([key]) =>
          !/^(__v|password|.*(?:token|verificationcode|expires))$/i.test(key)
        )
      ));

    return res.json({ success: true, data: employers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function registerEmployer(req, res) {
  try {
    await ensureDemoData();
    const { employerType, password, termsAccepted } = req.body;

    // Validate employer type
    if (!employerType || !['company', 'individual'].includes(employerType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or missing employerType. Must be "company" or "individual".' 
      });
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      return res.status(400).json({ 
        success: false, 
        error: 'Terms and conditions must be accepted.' 
      });
    }

    // Validate password
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters long.' 
      });
    }

    // Validate based on employer type
    let requiredFields = ['email', 'phone', 'country', 'city'];
    
    if (employerType === 'company') {
      requiredFields.push('companyName', 'businessType', 'contactPerson', 'position', 'address');
    } else {
      requiredFields.push('fullName', 'nationality', 'nationalIdPassport', 'occupation');
    }

    // Check for missing required fields
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build employer object based on type
    let employer = {
      employerId: `EMP-2026-${String(memoryState.employers.length + 1).padStart(4, '0')}`,
      employerType,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country,
      city: req.body.city,
      password: hashedPassword,
      termsAccepted: true,
      status: 'Pending approval',
      createdAt: new Date().toISOString(),
    };

    if (employerType === 'company') {
      employer = {
        ...employer,
        companyName: req.body.companyName,
        businessType: req.body.businessType,
        contactPerson: req.body.contactPerson,
        position: req.body.position,
        address: req.body.address,
        companyRegistrationNumber: req.body.companyRegistrationNumber || null,
        website: req.body.website || null,
        companyLogo: req.body.companyLogo || null,
      };
    } else {
      employer = {
        ...employer,
        fullName: req.body.fullName,
        nationality: req.body.nationality,
        nationalIdPassport: req.body.nationalIdPassport,
        occupation: req.body.occupation,
      };
    }

    memoryState.employers.unshift(employer);

    // Return employer data without password
    const { password: _, ...employerWithoutPassword } = employer;
    
    return res.status(201).json({ 
      success: true, 
      data: employerWithoutPassword,
      message: 'Employer registered successfully. Awaiting approval.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listAgents(req, res) {
  try {
    await ensureDemoData();
    return res.json({ success: true, data: memoryState.agents });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function registerAgent(req, res) {
  try {
    await ensureDemoData();
    const agent = {
      agentId: `AGT-2026-${String(memoryState.agents.length + 1).padStart(6, '0')}`,
      name: req.body.fullName ?? 'Unnamed agent',
      email: req.body.email ?? 'unknown@example.com',
      phone: req.body.phone ?? '',
      country: req.body.country ?? 'Unknown',
      agentType: req.body.agentType ?? 'Recruitment',
      status: 'Active',
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    memoryState.agents.unshift(agent);
    return res.status(201).json({ success: true, data: agent });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listBookings(req, res) {
  try {
    await ensureDemoData();
    return res.json({ success: true, data: memoryState.bookings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateBookingStatus(req, res) {
  try {
    await ensureDemoData();
    const { id } = req.params;
    const booking = memoryState.bookings.find((item) => item.bookingId === id || item._id === id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    booking.status = req.body?.status || booking.status;
    booking.updatedAt = new Date().toISOString();
    return res.json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listSupportTickets(req, res) {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: tickets });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function respondSupportTicket(req, res) {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findOne({
      $or: [{ ticketId: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])],
    });
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    const response = req.body?.response || req.body?.message;
    if (!response) {
      return res.status(400).json({ success: false, error: 'A response message is required' });
    }
    ticket.messages.push({ from: 'staff', text: response });
    ticket.status = 'pending';
    await ticket.save();
    return res.json({ success: true, data: ticket.toObject() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listAssignments(req, res) {
  try {
    await ensureDemoData();
    return res.json({ success: true, data: memoryState.assignments });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function postMarketplaceJob(req, res) {
  try {
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const now = new Date();
    const jobId = `JOB-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;
    const salaryValue = Number(req.body.salary) || 0;
    const requirements = typeof req.body.requirements === 'string'
      ? req.body.requirements
      : '';
    const images = Array.isArray(req.body.images)
      ? req.body.images
      : req.body.images ? [req.body.images] : [];

    const normalizedEmploymentType = normalizeEmploymentType(req.body.contractType || req.body.employmentType || '');
    const normalizedSalaryType = normalizeSalaryType(req.body.salaryType || '');

    const jobPayload = {
      jobId,
      jobTitle: req.body.title || req.body.position || 'Untitled job',
      title: req.body.title || req.body.position || 'Untitled job',
      position: req.body.position || req.body.title || 'Open Position',
      jobCategory: req.body.jobCategory || req.body.category || 'General',
      employmentType: normalizedEmploymentType,
      industry: req.body.industry || 'General',
      country: req.body.country || 'Global',
      city: req.body.city || '',
      location: req.body.location || req.body.city || '',
      workLocation: normalizeWorkLocation(req.body.workLocation),
      numberOfVacancies: Number(req.body.numberOfVacancies) || 1,
      applicationDeadline: parseDateOrDefault(
        req.body.applicationDeadline,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ),
      expectedStartDate: parseDateOrDefault(req.body.expectedStartDate, now),
      jobSummary: req.body.jobSummary || req.body.summary || '',
      description: req.body.description || '',
      images,
      coverImage: req.body.coverImage || images[0] || '',
      requiredSkills: Array.isArray(req.body.requiredSkills)
        ? req.body.requiredSkills
        : req.body.requiredSkills ? [req.body.requiredSkills] : [],
      qualifications: req.body.qualifications || '',
      yearsOfExperience: Number(req.body.yearsOfExperience) || 0,
      languagesRequired: Array.isArray(req.body.languagesRequired)
        ? req.body.languagesRequired
        : req.body.languagesRequired ? [req.body.languagesRequired] : [],
      preferredNationalities: Array.isArray(req.body.preferredNationalities)
        ? req.body.preferredNationalities
        : req.body.preferredNationalities ? [req.body.preferredNationalities] : [],
      preferredGender: normalizePreferredGender(req.body.preferredGender),
      ageRange: req.body.ageRange || { min: 18, max: 65 },
      salary: salaryValue,
      salaryType: normalizedSalaryType,
      currency: req.body.currency || 'USD',
      benefits: req.body.benefits || {},
      requirements: { ...(req.body.requirements || {}) },
      employerId: req.body.employerId || 'staff-marketplace',
      employerName: req.body.employerName || 'Bliss Global Marketplace',
      employerLogo: req.body.employerLogo || '',
      employerRating: req.body.employerRating ? Number(req.body.employerRating) : 4.5,
      employerVerified: true,
      status: 'Active',
      featured: req.body.featured === true,
      postedDate: now,
      publishedAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    if (mongoose.connection.readyState === 1) {
      const createdJob = await Job.create(jobPayload);
      const responseJob = createdJob.toObject();
      responseJob.shareUrl = `${baseUrl}/jobs/${createdJob.jobId}`;
      return res.status(201).json({ success: true, data: responseJob });
    }

    await ensureDemoData();
    const job = {
      ...jobPayload,
      shareUrl: `${baseUrl}/jobs/${jobId}`,
    };
    memoryState.jobs.unshift(job);
    return res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Staff marketplace post error:', error);
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((err) => err.message).join('; ');
      return res.status(400).json({ success: false, error: details || error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listJobs(req, res) {
  try {
    const requestedStatus = req.query.status?.toString();
    const filter = requestedStatus && requestedStatus !== 'all'
      ? { status: requestedStatus }
      : requestedStatus === 'all' ? {} : { status: 'Active' };
    if (mongoose.connection.readyState === 1) {
      const jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);
      return res.json({ success: true, data: jobs });
    }

    await ensureDemoData();
    const jobs = memoryState.jobs.filter((job) =>
      !filter.status || job.status === filter.status);
    return res.json({ success: true, data: jobs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function reviewJob(req, res) {
  try {
    const { jobId } = req.params;
    const { status, ...updates } = req.body || {};
    const allowedStatuses = ['PendingReview', 'Rejected', 'Active'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const allowedFields = [
      'jobTitle', 'title', 'position', 'jobCategory', 'employmentType',
      'industry', 'country', 'city', 'location', 'workLocation',
      'numberOfVacancies', 'applicationDeadline', 'expectedStartDate',
      'jobSummary', 'description', 'images', 'coverImage', 'requiredSkills',
      'qualifications', 'salary', 'salaryType', 'currency', 'benefits',
      'requirements', 'featured',
    ];
    const changes = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key)),
    );
    changes.status = status;
    if (status === 'Active') {
      const now = new Date();
      changes.postedDate = now;
      changes.publishedAt = now;
      changes.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (status !== 'Active') {
      changes.publishedAt = null;
      changes.expiresAt = null;
    }

    if (mongoose.connection.readyState === 1) {
      const job = await Job.findOneAndUpdate({ jobId }, changes, { new: true });
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
      await notifyEmployerOfJobReview(job, status);
      return res.json({ success: true, data: job, message: `Job marked ${status}` });
    }

    const job = memoryState.jobs.find((item) => item.jobId === jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    Object.assign(job, changes);
    await notifyEmployerOfJobReview(job, status);
    return res.json({ success: true, data: job, message: `Job marked ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function notifyEmployerOfJobReview(job, status) {
  if (!job.employerId || status === 'PendingReview') return;

  const approved = status === 'Active';
  await createNotification({
    userId: job.employerId,
    userType: 'employer',
    title: approved ? 'Job approved and published' : 'Job submission needs attention',
    message: approved
      ? `${job.title || job.jobTitle || 'Your job'} has been approved and published to the global marketplace.`
      : `${job.title || job.jobTitle || 'Your job'} was not approved for marketplace publication. Please review the staff feedback and update the submission.`,
    type: approved ? 'job_approved' : 'job_rejected',
    category: 'registration',
    entityType: 'job',
    entityId: job.jobId,
    employerName: job.employerName || '',
  }).catch((error) => {
    console.error('Job review notification failed:', error.message);
  });
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }

    const normalizedEmail = email.toString().trim().toLowerCase();
    const accounts = await seedStaffDirectory();
    if (mongoose.connection.readyState === 1) {
      const found = await Staff.findOne({ email: normalizedEmail });
      if (!found) return res.status(401).json({ success: false, error: 'Invalid staff credentials' });
      const isMatch = await found.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid staff credentials' });
      const token = createToken(found);
      const staff = found.toObject();
      delete staff.password;
      return res.json({ success: true, token, staff });
    }

    const match = accounts.find((item) => item.email?.toString().trim().toLowerCase() === normalizedEmail);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid staff credentials' });
    if (match.password !== password) return res.status(401).json({ success: false, error: 'Invalid staff credentials' });
    const token = createToken(match);
    const staff = { ...match };
    delete staff.password;
    return res.json({ success: true, token, staff });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listStaffAccounts(req, res) {
  try {
    const requestedDepartment = String(req.query?.department || '').trim();
    if (req.staff && !canAccessAllStaffChats(req.staff) && requestedDepartment &&
        requestedDepartment.toLowerCase() !== String(req.staff.department || '').toLowerCase()) {
      return res.status(403).json({ success: false, error: 'You can only view accounts in your department' });
    }
    const department = requestedDepartment || (req.staff && !canAccessAllStaffChats(req.staff)
      ? req.staff.department
      : '');
    const query = { isActive: { $ne: false }, ...(department ? { department } : {}) };
    const accounts = mongoose.connection.readyState === 1
      ? await Staff.find(query).select('-password').sort({ fullName: 1 }).lean()
      : memoryState.staff.filter((item) => item.isActive !== false && (!department || item.department === department));
    return res.json({ success: true, data: accounts.map((item) => ({ ...item, password: undefined })) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createStaffAccount(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role = 'Customer Care Officer',
      department = 'Customer Care',
      rank = 'Staff',
      blissId,
      country = 'Kenya',
      avatar,
      isActive = true,
    } = req.body || {};

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'fullName, email, phone and password are required',
      });
    }

    const normalizedEmail = email.toString().trim().toLowerCase();
    if (mongoose.connection.readyState === 1) {
      const existing = await Staff.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Staff account already exists' });
      }

      const staff = await Staff.create({
        fullName,
        email: normalizedEmail,
        phone,
        password,
        role,
        department,
        rank,
        blissId: blissId || `BC-${Date.now()}`,
        country,
        avatar: avatar ?? '',
        isActive,
      });
      const staffData = staff.toObject();
      delete staffData.password;
      return res.status(201).json({ success: true, data: staffData });
    }

    const existing = memoryState.staff.find(
      (item) => item.email?.toString().trim().toLowerCase() === normalizedEmail,
    );
    if (existing) {
      return res.status(409).json({ success: false, error: 'Staff account already exists' });
    }

    const newStaff = {
      _id: `staff-${memoryState.staff.length + 1}`,
      fullName,
      email: normalizedEmail,
      phone,
      password,
      role,
      department,
      rank,
      blissId: blissId ?? `BC-${String(memoryState.staff.length + 1).padStart(6, '0')}`,
      country,
      avatar: avatar ?? '',
      isActive,
      online: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryState.staff.unshift(newStaff);
    const responseStaff = { ...newStaff };
    delete responseStaff.password;
    return res.status(201).json({ success: true, data: responseStaff });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function dashboard(req, res) {
  try {
    const conversations = mongoose.connection.readyState === 1
      ? await StaffConversation.find().lean()
      : memoryState.conversations;

    const unreadMessages = conversations.reduce((total, item) => total + (item.unreadCount || 0), 0);
    const payload = {
      success: true,
      data: {
        totalOnlineUsers: 128,
        activeChats: conversations.length,
        unreadMessages,
        pendingInterviews: 9,
        pendingVisaApplications: 5,
        pendingDeployments: 3,
        pendingContracts: 4,
        pendingEmployerApprovals: 2,
        pendingAgentApprovals: 1,
        pendingPayments: 6,
        todaysRegistrations: 18,
        todaysDeployments: 4,
        revenueSummary: 2450000,
        announcements: ['Bliss Chat is now live for all staff.', 'Visa approvals are being processed faster.'],
      },
    };
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function performance(req, res) {
  try {
    const conversations = mongoose.connection.readyState === 1
      ? await StaffConversation.find().lean()
      : memoryState.conversations;

    const totalConversations = conversations.length;
    const openConversations = conversations.filter((c) => c.status === 'Open').length;
    const unreadMessages = conversations.reduce((total, item) => total + (item.unreadCount || 0), 0);

    return res.json({
      success: true,
      data: {
        totalConversations,
        openConversations,
        unreadMessages,
        avgResponseMinutes: 12,
        slaCompliance: '94%',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listChats(req, res) {
  try {
    await backfillStaffConversationQueues();
    const conversations = mongoose.connection.readyState === 1
      ? await StaffConversation.find(staffChatScope(req.staff)).sort({ updatedAt: -1 }).lean()
      : memoryState.conversations.filter((conversation) => staffCanAccessConversation(req.staff, conversation));
    return res.json({
      success: true,
      data: conversations.map((conversation) => ({
        ...conversation,
        online: isCustomerOnline(conversation),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateCustomerPresence(req, res) {
  try {
    const blissId = String(req.user?.blissId || '').trim();
    const { online } = req.body || {};
    if (!blissId) {
      return res.status(403).json({ success: false, error: 'Customer account required.' });
    }
    if (typeof online !== 'boolean') {
      return res.status(400).json({ success: false, error: 'online must be a boolean.' });
    }

    const conversationsUpdated = await setCustomerPresence(blissId, online);
    return res.json({
      success: true,
      data: { online, conversationsUpdated },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getChatById(req, res) {
  try {
    const { id } = req.params;
    let conversation = await findAccessibleConversation(req, id);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    if (mongoose.connection.readyState === 1) {
      await Promise.all([
        StaffConversation.updateOne({ conversationId: id, ...staffChatScope(req.staff) }, { $set: { unreadCount: 0 } }),
        StaffMessage.updateMany({ conversationId: id, sender: 'customer' }, { $set: { read: true } }),
      ]);
      conversation = await StaffConversation.findOne({ conversationId: id, ...staffChatScope(req.staff) }).lean();
    } else {
      conversation.unreadCount = 0;
      memoryState.messages
        .filter((message) => message.conversationId === id && message.sender === 'customer')
        .forEach((message) => { message.read = true; });
    }
    const messages = mongoose.connection.readyState === 1
      ? await StaffMessage.find({ conversationId: id }).sort({ createdAt: 1 }).lean()
      : memoryState.messages.filter((item) => item.conversationId === id);
    return res.json({ success: true, data: { conversation, messages } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function receiveBlissAppMessage(req, res) {
  try {
    const payload = req.body || {};
    const result = await ingestIncomingBlissAppMessage(payload);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

async function sendMessage(req, res) {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'conversationId and text are required' });
    }
    const accessibleConversation = await findAccessibleConversation(req, conversationId);
    if (!accessibleConversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

    const authenticatedSender = req.staff.fullName || req.staff.email || 'Staff';
    const message = mongoose.connection.readyState === 1
      ? await StaffMessage.create({ conversationId, sender: 'staff', senderName: authenticatedSender, text, type: 'text' })
      : { conversationId, sender: 'staff', senderName: authenticatedSender, text, type: 'text', read: false, createdAt: new Date().toISOString() };

    if (mongoose.connection.readyState !== 1) {
      memoryState.messages.push(message);
      const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
      if (conversation) {
        conversation.lastMessage = text;
        conversation.lastActive = 'Just now';
        conversation.status = 'Waiting Candidate';
      }
    } else {
      await StaffConversation.findOneAndUpdate(
        { conversationId },
        { lastMessage: text, lastActive: 'Just now', status: 'Waiting Candidate' },
        { new: true }
      );
    }

    const online = isCustomerOnline(accessibleConversation);
    const offlineDeliveries = online
      ? null
      : await notifyCustomerOfOfflineReply(accessibleConversation, authenticatedSender);

    if (mongoose.connection.readyState === 1) {
      await StaffNotification.create({ title: 'Staff reply sent', body: `${authenticatedSender} replied to ${conversationId}`, type: 'chat' });
    } else {
      memoryState.notifications.push({ title: 'Staff reply sent', body: `${authenticatedSender} replied to ${conversationId}`, type: 'chat', read: false, createdAt: new Date().toISOString() });
    }

    return res.status(201).json({
      success: true,
      data: message,
      channels: {
        inApp: offlineDeliveries?.inApp || { success: false, skipped: true },
        email: offlineDeliveries?.email || { success: false, skipped: true },
        push: offlineDeliveries?.push || { success: false, skipped: true },
        whatsapp: offlineDeliveries?.whatsapp || { success: false, skipped: true },
      },
      customerOnline: online,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function sendMultichannelMessage(req, res) {
  try {
    const { conversationId, text, subject = 'Message from Bliss Connect', channels = {} } = req.body || {};
    const body = String(text || '').trim();
    if (!conversationId || !body) {
      return res.status(400).json({ success: false, error: 'conversationId and text are required' });
    }
    const conversation = await findAccessibleConversation(req, conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

    const sender = req.staff.fullName || req.staff.email || 'Bliss Connect';
    const message = mongoose.connection.readyState === 1
      ? await StaffMessage.create({ conversationId, sender: 'staff', senderName: sender, text: body, type: 'text' })
      : { conversationId, sender: 'staff', senderName: sender, text: body, type: 'text', read: false, createdAt: new Date().toISOString() };
    if (mongoose.connection.readyState === 1) {
      await StaffConversation.findOneAndUpdate({ conversationId }, { lastMessage: body, lastActive: 'Just now', status: 'Waiting Candidate' });
    } else {
      memoryState.messages.push(message);
      Object.assign(conversation, { lastMessage: body, lastActive: 'Just now', status: 'Waiting Candidate' });
    }

    const deliveries = {};
    if (channels.app === true) {
      const pushIds = [conversation.blissId, conversationId].map((value) => String(value || '').trim()).filter(Boolean);
      deliveries.app = await sendPushForNotification({
        userId: pushIds[0], userIds: pushIds.slice(1), userType: 'candidate',
        notificationId: `STAFF-${message._id?.toString?.() || Date.now()}`,
        notificationType: 'staff_message', title: `Message from ${sender}`, message: body,
        entityType: 'conversation', entityId: conversationId,
      }).catch((error) => ({ success: false, sent: 0, error: error.message }));
    }

    if (channels.whatsapp === true) {
      const phone = String(conversation.customerPhone || '').trim();
      const digits = phone.replace(/\D/g, '').replace(/^00/, '');
      const forms = phone ? [...new Set([phone, digits, `+${digits}`])] : [];
      const [contact, optedOut] = forms.length ? await Promise.all([
        WhatsAppContact.findOne({ phoneNumber: { $in: forms }, optedIn: true, optedOut: false }).select('phoneNumber').lean(),
        WhatsAppOptOut.findOne({ phoneNumber: { $in: forms } }).select('_id').lean(),
      ]) : [null, null];
      if (optedOut) deliveries.whatsapp = { success: false, error: 'Customer has opted out of WhatsApp messages.' };
      else if (!contact) deliveries.whatsapp = { success: false, error: 'No WhatsApp opt-in contact exists for this number.' };
      else deliveries.whatsapp = await sendWhatsAppMessage(contact.phoneNumber, body);
    }

    if (channels.email === true) {
      if (!conversation.customerEmail) deliveries.email = { success: false, error: 'No email address is available for this conversation.' };
      else {
        const result = await sendEmail({ to: conversation.customerEmail, subject: String(subject).trim() || 'Message from Bliss Connect', text: body });
        deliveries.email = result ? { success: true } : { success: false, error: 'Email delivery failed. Check the email provider configuration.' };
      }
    }

    return res.status(201).json({ success: true, data: message, channels: deliveries });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateChatStatus(req, res) {
  try {
    const { conversationId, status } = req.body || {};
    const allowedStatuses = ['New', 'Open', 'Waiting Candidate', 'Waiting Staff', 'Closed'];
    if (!conversationId || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'conversationId and a valid chat status are required' });
    }
    const conversation = await findAccessibleConversation(req, conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const updated = mongoose.connection.readyState === 1
      ? await StaffConversation.findOneAndUpdate(
          { conversationId, ...staffChatScope(req.staff) },
          { status },
          { new: true },
        ).lean()
      : Object.assign(conversation, { status });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function scheduleChatFollowUp(req, res) {
  try {
    const { conversationId, nextFollowUpAt, followUpNote = '' } = req.body || {};
    const scheduledAt = new Date(nextFollowUpAt);
    if (!conversationId || !nextFollowUpAt || Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ success: false, error: 'A valid conversationId and nextFollowUpAt are required' });
    }
    const conversation = await findAccessibleConversation(req, conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const update = { nextFollowUpAt: scheduledAt, followUpNote: String(followUpNote).trim() };
    const updated = mongoose.connection.readyState === 1
      ? await StaffConversation.findOneAndUpdate(
          { conversationId, ...staffChatScope(req.staff) }, update, { new: true },
        ).lean()
      : Object.assign(conversation, update);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listChatFollowUps(req, res) {
  try {
    const now = new Date();
    const dueOnly = req.query?.due === 'true';
    const filter = { ...staffChatScope(req.staff), nextFollowUpAt: dueOnly
      ? { $ne: null, $lte: now }
      : { $ne: null } };
    const data = mongoose.connection.readyState === 1
      ? await StaffConversation.find(filter).sort({ nextFollowUpAt: 1 }).limit(200).lean()
      : memoryState.conversations
          .filter((item) => staffCanAccessConversation(req.staff, item) && item.nextFollowUpAt && (!dueOnly || new Date(item.nextFollowUpAt) <= now))
          .sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt)).slice(0, 200);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function broadcast(req, res) {
  try {
    const {
      subject,
      message,
      templateName,
      templateParameters = [],
      targetGroup = 'all_contacted_users',
    } = req.body || {};
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, error: 'Campaign subject and message are required' });
    }
    if (!templateName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'An approved WhatsApp template name is required for a campaign.',
      });
    }
    if (!Array.isArray(templateParameters)) {
      return res.status(400).json({ success: false, error: 'templateParameters must be an array of strings' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Campaign delivery requires the database and WhatsApp campaign service' });
    }
    const campaignService = require('../services/whatsappCampaignService');
    const tagsByAudience = {
      all_contacted_users: [],
      active_applicants: ['active_applicant'],
      interested_employers: ['interested_employer'],
    };
    if (!Object.prototype.hasOwnProperty.call(tagsByAudience, targetGroup)) {
      return res.status(400).json({ success: false, error: 'Unsupported campaign audience' });
    }
    const campaign = await campaignService.createCampaign({
      name: subject.trim(),
      message: message.trim(),
      templateName: templateName.trim(),
      templateParameters: templateParameters.map((value) => String(value)),
      audienceTags: tagsByAudience[targetGroup],
      createdBy: req.staff.email || req.staff.sub || 'staff',
    });
    try {
      const queue = await campaignService.queueCampaign(campaign._id.toString());
      const launch = await campaignService.launchCampaign(campaign._id.toString());
      return res.status(200).json({ success: true, data: { campaignId: campaign._id, status: launch.status, queued: queue.contactsQueued } });
    } catch (error) {
      await campaignService.deleteCampaign(campaign._id.toString()).catch(() => {});
      throw error;
    }
  } catch (error) {
    return res.status(503).json({ success: false, error: error.message });
  }
}

async function uploadFile(req, res) {
  try {
    const { conversationId, fileName, sender } = req.body;
    if (!conversationId || !fileName || !sender) {
      return res.status(400).json({ success: false, error: 'conversationId, fileName and sender are required' });
    }
    const accessibleConversation = await findAccessibleConversation(req, conversationId);
    if (!accessibleConversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

    return res.json({ success: true, data: { conversationId, fileName, sender, uploadedAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function assignConversation(req, res) {
  try {
    const { conversationId, assignedTo, department, queueType: requestedQueueType } = req.body;
    if (!conversationId) return res.status(400).json({ success: false, error: 'conversationId is required' });
    const accessibleConversation = await findAccessibleConversation(req, conversationId);
    if (!accessibleConversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const targetDepartment = department || accessibleConversation.department;
    if (!canAccessAllStaffChats(req.staff) && targetDepartment.toLowerCase() !== String(req.staff.department || '').toLowerCase()) {
      return res.status(403).json({ success: false, error: 'You cannot assign conversations to another department' });
    }

    let targetAccount = null;
    if (assignedTo) {
      const identifier = String(assignedTo).trim();
      targetAccount = mongoose.connection.readyState === 1
        ? await Staff.findOne({
            isActive: true,
            department: targetDepartment,
            $or: [
              { email: identifier.toLowerCase() },
              { fullName: identifier },
              ...(mongoose.Types.ObjectId.isValid(identifier) ? [{ _id: identifier }] : []),
            ],
          }).select('email fullName department').lean()
        : memoryState.staff.find((item) => item.isActive !== false && item.department === targetDepartment &&
            [item.email, item.fullName, item._id, item.id].some((value) => String(value || '').toLowerCase() === identifier.toLowerCase()));
      if (!targetAccount) return res.status(400).json({ success: false, error: 'Choose an active staff member in the selected department' });
    }
    const normalizedAssignee = targetAccount?.email || '';
    const changingDepartment = targetDepartment.toLowerCase() !== String(accessibleConversation.department || '').toLowerCase();
    const queueType = requestedQueueType || (changingDepartment ? queueForDepartment(targetDepartment) : accessibleConversation.queueType);
    if (!isQueueAllowedForDepartment(queueType, targetDepartment)) {
      return res.status(400).json({ success: false, error: 'The selected chat queue does not belong to this department' });
    }
    const changingQueue = changingDepartment || queueType !== accessibleConversation.queueType;
    const queueName = changingQueue ? queueType : accessibleConversation.queueName;

    if (mongoose.connection.readyState === 1) {
      const updated = await StaffConversation.findOneAndUpdate(
        { conversationId, ...staffChatScope(req.staff) },
        {
          assignedTo: normalizedAssignee,
          department: targetDepartment,
          ...(changingQueue ? { queueType, queueName } : {}),
        },
        { new: true }
      );
      return res.json({ success: true, data: updated });
    }

    const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    conversation.assignedTo = normalizedAssignee;
    conversation.department = targetDepartment;
    if (changingQueue) {
      conversation.queueType = queueType;
      conversation.queueName = queueName;
    }
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function transferConversation(req, res) {
  try {
    const { conversationId, department, assignedTo } = req.body;
    if (!conversationId || !department) return res.status(400).json({ success: false, error: 'conversationId and department are required' });
    if (!canAccessAllStaffChats(req.staff)) {
      return res.status(403).json({ success: false, error: 'Only an operations lead can transfer conversations across departments' });
    }
    const accessibleConversation = await findAccessibleConversation(req, conversationId);
    if (!accessibleConversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    let normalizedAssignee = '';
    if (assignedTo) {
      const identifier = String(assignedTo).trim();
      const targetAccount = mongoose.connection.readyState === 1
        ? await Staff.findOne({
            isActive: true,
            department,
            $or: [
              { email: identifier.toLowerCase() },
              { fullName: identifier },
              ...(mongoose.Types.ObjectId.isValid(identifier) ? [{ _id: identifier }] : []),
            ],
          }).select('email').lean()
        : memoryState.staff.find((item) => item.isActive !== false && item.department === department &&
            [item.email, item.fullName, item._id, item.id].some((value) => String(value || '').toLowerCase() === identifier.toLowerCase()));
      if (!targetAccount) return res.status(400).json({ success: false, error: 'Choose an active staff member in the destination department' });
      normalizedAssignee = targetAccount.email;
    }

    if (mongoose.connection.readyState === 1) {
      const updated = await StaffConversation.findOneAndUpdate({ conversationId }, { department, assignedTo: normalizedAssignee }, { new: true });
      return res.json({ success: true, data: updated });
    }

    const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    conversation.department = department;
    conversation.assignedTo = normalizedAssignee;
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function addInternalNote(req, res) {
  try {
    const { conversationId, note } = req.body;
    if (!conversationId || !note) return res.status(400).json({ success: false, error: 'conversationId and note are required' });
    const accessibleConversation = await findAccessibleConversation(req, conversationId);
    if (!accessibleConversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

    if (mongoose.connection.readyState === 1) {
      const updated = await StaffConversation.findOneAndUpdate(
        { conversationId },
        { $push: { notes: note } },
        { new: true }
      );
      return res.json({ success: true, data: updated });
    }

    const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    if (!conversation.notes) conversation.notes = [];
    conversation.notes.push(note);
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

  async function fetchNotifications(req, res) {
    try {
      const notifications = mongoose.connection.readyState === 1
        ? await StaffNotification.find().sort({ createdAt: -1 }).limit(200)
        : memoryState.notifications;
      return res.json({ success: true, data: notifications });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

module.exports = {
  login,
  listStaffAccounts,
  createStaffAccount,
  dashboard,
  performance,
  fetchNotifications,
  listChats,
  updateCustomerPresence,
  getChatById,
  receiveBlissAppMessage,
  sendMessage,
  sendMultichannelMessage,
  uploadFile,
  assignConversation,
  updateChatStatus,
  scheduleChatFollowUp,
  listChatFollowUps,
  transferConversation,
  addInternalNote,
  listApplications,
  updateApplication,
  listPendingCandidates,
  completeCandidate,
  listEmployers,
  registerEmployer,
  listAgents,
  registerAgent,
  listBookings,
  updateBookingStatus,
  listSupportTickets,
  respondSupportTicket,
  listAssignments,
  postMarketplaceJob,
  listJobs,
  reviewJob,
  broadcast,
};
