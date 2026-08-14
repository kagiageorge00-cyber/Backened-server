const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const Job = require('../models/Job');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const StaffNotification = require('../models/StaffNotification');
const { ingestIncomingBlissAppMessage } = require('../services/staffOperationsBridge');

const JWT_SECRET = process.env.JWT_SECRET || 'bliss-staff-secret';

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

const staffSeedProfiles = [
  {
    fullName: 'Hannah Maina',
    email: 'support@blissconnect.com',
    phone: '+254700000000',
    password: 'Password123!',
    role: 'Customer Care Officer',
    department: 'Customer Care',
    blissId: 'BC-2026-000001',
    country: 'Kenya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    fullName: 'Daniel Otieno',
    email: 'daniel@blissconnect.com',
    phone: '+254700000001',
    password: 'Password123!',
    role: 'Visa Officer',
    department: 'Visa',
    blissId: 'BC-2026-000003',
    country: 'Kenya',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
  {
    fullName: 'Njeri Wanjiku',
    email: 'njeri@blissconnect.com',
    phone: '+254700000002',
    password: 'Password123!',
    role: 'Recruitment Officer',
    department: 'Recruitment',
    blissId: 'BC-2026-000004',
    country: 'Kenya',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    fullName: 'Kevin Kimani',
    email: 'kevin@blissconnect.com',
    phone: '+254700000003',
    password: 'Password123!',
    role: 'Operations Lead',
    department: 'Operations',
    blissId: 'BC-2026-000005',
    country: 'Kenya',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
  },
];

function createToken(staff) {
  return jwt.sign(
    {
      sub: staff._id || staff.id,
      email: staff.email,
      role: staff.role,
      department: staff.department,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
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
    const existingEmails = new Set((await Staff.find({}, 'email').lean()).map((item) => item.email));
    for (const profile of staffSeedProfiles) {
      if (!existingEmails.has(profile.email)) {
        await Staff.create(profile);
        existingEmails.add(profile.email);
      }
    }

    return Staff.find({ email: { $in: staffSeedProfiles.map((profile) => profile.email) } }).sort({ createdAt: 1 }).lean();
  }

  const existingStaff = memoryState.staff.filter((item) => staffSeedProfiles.some((profile) => profile.email === item.email));
  if (existingStaff.length < staffSeedProfiles.length) {
    for (const profile of staffSeedProfiles) {
      if (!memoryState.staff.some((item) => item.email === profile.email)) {
        memoryState.staff.push({
          _id: profile.email,
          ...profile,
          online: true,
        });
      }
    }
  }

  return memoryState.staff.filter((item) => staffSeedProfiles.some((profile) => profile.email === item.email));
}

async function seedStaff() {
  const accounts = await seedStaffDirectory();
  return accounts[0];
}

async function ensureDemoConversations() {
  if (mongoose.connection.readyState === 1) {
    const count = await StaffConversation.countDocuments();
    if (count > 0) return;

    const demoConversation = await StaffConversation.create({
      conversationId: 'conv-demo-1',
      customerName: 'Amina Yusuf',
      customerEmail: 'amina@example.com',
      customerPhone: '+254712345678',
      blissId: 'BC-2026-000002',
      userType: 'Candidate',
      country: 'Kenya',
      status: 'Open',
      priority: 'High',
      assignedTo: 'Hannah Maina',
      department: 'Customer Care',
      unreadCount: 2,
      lastMessage: 'Passport upload received',
      lastActive: '2 mins ago',
      online: true,
      notes: ['Candidate missing passport'],
    });

    await StaffMessage.create({
      conversationId: demoConversation.conversationId,
      sender: 'customer',
      text: 'Hello, I uploaded my passport.',
      type: 'text',
      read: true,
    });

    await StaffMessage.create({
      conversationId: demoConversation.conversationId,
      sender: 'staff',
      text: 'Thank you, I have noted it.',
      type: 'text',
      read: false,
    });

    await StaffNotification.create({
      title: 'New chat received',
      body: 'Amina Yusuf sent a new message',
      type: 'chat',
    });
    return;
  }

  if (memoryState.conversations.length === 0) {
    memoryState.conversations.push({
      conversationId: 'conv-demo-1',
      customerName: 'Amina Yusuf',
      customerEmail: 'amina@example.com',
      customerPhone: '+254712345678',
      blissId: 'BC-2026-000002',
      userType: 'Candidate',
      country: 'Kenya',
      status: 'Open',
      priority: 'High',
      assignedTo: 'Hannah Maina',
      department: 'Customer Care',
      unreadCount: 2,
      lastMessage: 'Passport upload received',
      lastActive: '2 mins ago',
      online: true,
      notes: ['Candidate missing passport'],
    });

    memoryState.messages.push({
      conversationId: 'conv-demo-1',
      sender: 'customer',
      text: 'Hello, I uploaded my passport.',
      type: 'text',
      read: true,
      createdAt: new Date().toISOString(),
    });

    memoryState.messages.push({
      conversationId: 'conv-demo-1',
      sender: 'staff',
      text: 'Thank you, I have noted it.',
      type: 'text',
      read: false,
      createdAt: new Date().toISOString(),
    });

    memoryState.notifications.push({
      title: 'New chat received',
      body: 'Amina Yusuf sent a new message',
      type: 'chat',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

async function ensureDemoData() {
  await ensureDemoConversations();
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

  if (memoryState.supportTickets.length === 0) {
    memoryState.supportTickets.push(
      {
        ticketId: 'TCK-001',
        subject: 'Passport upload issue',
        status: 'Open',
        messages: [
          { from: 'customer', text: 'I cannot upload my passport image.' },
        ],
      },
      {
        ticketId: 'TCK-002',
        subject: 'Employer contract question',
        status: 'Pending',
        messages: [
          { from: 'customer', text: 'When will the employer sign the contract?' },
        ],
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
    return res.json({ success: true, data: memoryState.employers });
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
    await ensureDemoData();
    return res.json({ success: true, data: memoryState.supportTickets });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function respondSupportTicket(req, res) {
  try {
    await ensureDemoData();
    const { id } = req.params;
    const ticket = memoryState.supportTickets.find((item) => item.ticketId === id || item._id === id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    if (!ticket.messages) ticket.messages = [];
    ticket.messages.push({ from: 'staff', text: req.body?.response || req.body?.message || 'Staff replied' });
    ticket.status = 'Pending';
    ticket.updatedAt = new Date().toISOString();
    return res.json({ success: true, data: ticket });
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
    if (mongoose.connection.readyState === 1) {
      const jobs = await Job.find({ status: 'Active' })
        .sort({ publishedAt: -1 })
        .limit(100);
      return res.json({ success: true, data: jobs });
    }

    await ensureDemoData();
    return res.json({ success: true, data: memoryState.jobs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
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
    const accounts = await seedStaffDirectory();
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
      blissId: blissId ?? `BC-${String(memoryState.staff.length + 1).padStart(6, '0')}`,
      country,
      avatar: avatar ?? '',
      isActive,
      online: true,
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
    await ensureDemoConversations();
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
    await ensureDemoConversations();
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
    await ensureDemoConversations();
    const conversations = mongoose.connection.readyState === 1
      ? await StaffConversation.find().sort({ updatedAt: -1 }).lean()
      : memoryState.conversations;
    return res.json({ success: true, data: conversations });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getChatById(req, res) {
  try {
    const { id } = req.params;
    const conversation = mongoose.connection.readyState === 1
      ? await StaffConversation.findOne({ conversationId: id }).lean()
      : memoryState.conversations.find((item) => item.conversationId === id);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
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
    const { conversationId, sender, text, senderName } = req.body;
    if (!conversationId || !sender || !text) {
      return res.status(400).json({ success: false, error: 'conversationId, sender and text are required' });
    }

    const message = mongoose.connection.readyState === 1
      ? await StaffMessage.create({ conversationId, sender: senderName || sender, text, type: 'text' })
      : { conversationId, sender: senderName || sender, text, type: 'text', read: false, createdAt: new Date().toISOString() };

    if (mongoose.connection.readyState !== 1) {
      memoryState.messages.push(message);
      const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
      if (conversation) {
        conversation.lastMessage = text;
        conversation.lastActive = 'Just now';
        conversation.status = 'Replied';
      }
    } else {
      await StaffConversation.findOneAndUpdate(
        { conversationId },
        { lastMessage: text, lastActive: 'Just now', status: 'Replied' },
        { new: true }
      );
    }

    if (mongoose.connection.readyState === 1) {
      await StaffNotification.create({ title: 'Staff reply sent', body: `${senderName || sender} replied to ${conversationId}`, type: 'chat' });
    } else {
      memoryState.notifications.push({ title: 'Staff reply sent', body: `${senderName || sender} replied to ${conversationId}`, type: 'chat', read: false, createdAt: new Date().toISOString() });
    }

    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function broadcast(req, res) {
  try {
    return res.status(501).json({
      success: false,
      error: 'Broadcast endpoint is not implemented yet. Please contact the API maintainer.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function uploadFile(req, res) {
  try {
    const { conversationId, fileName, sender } = req.body;
    if (!conversationId || !fileName || !sender) {
      return res.status(400).json({ success: false, error: 'conversationId, fileName and sender are required' });
    }

    return res.json({ success: true, data: { conversationId, fileName, sender, uploadedAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function assignConversation(req, res) {
  try {
    const { conversationId, assignedTo, department } = req.body;
    if (!conversationId || !assignedTo) return res.status(400).json({ success: false, error: 'conversationId and assignedTo are required' });

    if (mongoose.connection.readyState === 1) {
      const updated = await StaffConversation.findOneAndUpdate(
        { conversationId },
        { assignedTo, department: department || 'Customer Care' },
        { new: true }
      );
      return res.json({ success: true, data: updated });
    }

    const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    conversation.assignedTo = assignedTo;
    conversation.department = department || conversation.department;
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function transferConversation(req, res) {
  try {
    const { conversationId, department, assignedTo } = req.body;
    if (!conversationId || !department) return res.status(400).json({ success: false, error: 'conversationId and department are required' });

    if (mongoose.connection.readyState === 1) {
      const updated = await StaffConversation.findOneAndUpdate({ conversationId }, { department, assignedTo }, { new: true });
      return res.json({ success: true, data: updated });
    }

    const conversation = memoryState.conversations.find((item) => item.conversationId === conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    conversation.department = department;
    if (assignedTo) conversation.assignedTo = assignedTo;
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function addInternalNote(req, res) {
  try {
    const { conversationId, note } = req.body;
    if (!conversationId || !note) return res.status(400).json({ success: false, error: 'conversationId and note are required' });

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
      await ensureDemoConversations();
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
  getChatById,
  receiveBlissAppMessage,
  sendMessage,
  uploadFile,
  assignConversation,
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
  broadcast,
};
