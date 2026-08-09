const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const StaffConversation = require('../models/StaffConversation');
const StaffMessage = require('../models/StaffMessage');
const StaffNotification = require('../models/StaffNotification');
const Candidate = require('../models/candidate');
const { ingestIncomingBlissAppMessage } = require('../services/staffOperationsBridge');
const Interview = require('../models/Interview');
const JobApplication = require('../models/JobApplication');
const Payment = require('../models/Payment');
const Deployment = require('../models/Deployment');

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

async function seedStaffDirectory() {
  if (mongoose.connection.readyState === 1) {
    const existingEmails = new Set((await Staff.find({}, 'email').lean()).map((item) => item.email));
    for (const profile of staffSeedProfiles) {
      if (!existingEmails.has(profile.email)) {
        await Staff.create(profile);
        existingEmails.add(profile.email);
      }
    }

    return Staff.find({}).sort({ createdAt: 1 }).lean();
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

  return memoryState.staff;
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
  // When the DB is not connected we intentionally avoid seeding in-memory demo
  // conversations so that staff operations rely on persisted data only.
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
    const updates = req.body || {};
    const searchIdentifier = updates.candidateId || updates.candidateCode || id;

    let candidate = null;
    if (mongoose.connection.readyState === 1) {
      candidate = await Candidate.findOne({
        $or: [
          { _id: searchIdentifier },
          { uniqueCode: searchIdentifier },
          { candidateId: searchIdentifier },
          { email: updates.email },
          { phone: updates.phone },
          { fullName: updates.candidateName || updates.name },
          { name: updates.candidateName || updates.name },
        ].filter(Boolean),
      });
    }

    if (!candidate) {
      const memoryCandidate = memoryState.pendingCandidates.find((item) => item.candidateId === id || item._id === id);
      if (!memoryCandidate) {
        return res.status(404).json({ success: false, error: 'Candidate not found' });
      }
      Object.assign(memoryCandidate, {
        ...updates,
        outstanding: [],
        completedAt: new Date().toISOString(),
        status: 'Completed',
      });
      return res.json({ success: true, data: memoryCandidate });
    }

    const nextCandidate = {
      ...candidate.toObject ? candidate.toObject() : candidate,
      fullName: updates.candidateName || updates.fullName || updates.name || candidate.fullName || candidate.name || '',
      name: updates.name || updates.candidateName || updates.fullName || candidate.name || candidate.fullName || '',
      email: updates.email || candidate.email || '',
      phone: updates.phone || candidate.phone || '',
      country: updates.country || candidate.country || '',
      nationality: updates.nationality || candidate.nationality || '',
      gender: updates.gender || candidate.gender || '',
      dateOfBirth: updates.dateOfBirth || candidate.dateOfBirth || '',
      maritalStatus: updates.maritalStatus || candidate.maritalStatus || '',
      numberOfChildren: updates.numberOfChildren ?? candidate.numberOfChildren,
      jobPosition: updates.jobPosition || candidate.jobPosition || '',
      jobType: updates.jobType || candidate.jobType || '',
      destinationCountry: updates.destinationCountry || candidate.destinationCountry || '',
      expectedSalary: updates.expectedSalary || candidate.expectedSalary || '',
      photoUrl: updates.photoUrl || candidate.photoUrl || '',
      passportUrl: updates.passportUrl || candidate.passportUrl || '',
      medicalUrl: updates.medicalUrl || candidate.medicalUrl || '',
      videoUrl: updates.videoUrl || updates.introductionVideoUrl || candidate.videoUrl || candidate.introductionVideoUrl || '',
      introductionVideoUrl: updates.introductionVideoUrl || updates.videoUrl || candidate.introductionVideoUrl || candidate.videoUrl || '',
      resumeUrl: updates.resumeUrl || candidate.resumeUrl || '',
      goodConductUrl: updates.goodConductUrl || candidate.goodConductUrl || '',
      candidateFormLink: updates.candidateFormLink || candidate.candidateFormLink || '',
      uniqueCode: updates.candidateCode || candidate.uniqueCode || candidate.candidateId || id,
      candidateId: updates.candidateId || candidate.candidateId || candidate.uniqueCode || id,
      documents: {
        ...(candidate.documents || {}),
        ...(updates.documents || {}),
        passportPhoto: updates.documents?.passportPhoto || updates.passportPhoto || updates.photoUrl || candidate.documents?.passportPhoto || candidate.passportUrl || candidate.photoUrl || '',
        cv: updates.documents?.cv || updates.resumeUrl || candidate.documents?.cv || candidate.resumeUrl || '',
        certificates: updates.documents?.certificates || candidate.documents?.certificates || [],
        coverLetter: updates.documents?.coverLetter || updates.additionalUrl || candidate.documents?.coverLetter || candidate.additionalUrl || '',
      },
      outstanding: [],
      completedAt: new Date().toISOString(),
      status: 'approved',
    };

    Object.assign(candidate, nextCandidate);
    await candidate.save();
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
    const employer = {
      employerId: `EMP-2026-${String(memoryState.employers.length + 1).padStart(4, '0')}`,
      name: req.body.companyName ?? req.body.name ?? 'Unnamed employer',
      contactEmail: req.body.email ?? 'unknown@example.com',
      contactPhone: req.body.phone ?? '',
      country: req.body.country ?? 'Unknown',
      status: 'Pending approval',
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    memoryState.employers.unshift(employer);
    return res.status(201).json({ success: true, data: employer });
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
    await ensureDemoData();
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const job = {
      jobId: `JOB-2026-${String(memoryState.jobs.length + 1).padStart(4, '0')}`,
      title: req.body.title ?? 'Untitled job',
      position: req.body.position ?? req.body.title ?? 'Open Position',
      country: req.body.country ?? 'Global',
      location: req.body.location ?? 'Unknown',
      salary: req.body.salary ?? 'Negotiable',
      duration: req.body.duration ?? 'Flexible',
      contractType: req.body.contractType ?? 'Full Time',
      requirements: req.body.requirements ?? '',
      description: req.body.description ?? '',
      images: Array.isArray(req.body.images) ? req.body.images : [],
      status: 'Published',
      postedAt: new Date().toISOString(),
      shareUrl: `${baseUrl}/jobs/JOB-2026-${String(memoryState.jobs.length + 1).padStart(4, '0')}`,
    };
    memoryState.jobs.unshift(job);
    return res.status(201).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listJobs(req, res) {
  try {
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

    if (mongoose.connection.readyState === 1) {
      try {
        const totalOnlineUsers = await Staff.countDocuments({ online: true });
        const activeChats = conversations.length;

        // Safe queries with fallbacks
        const pendingInterviews = await Interview.countDocuments({ meetingStatus: 'scheduled' }).catch(() => 0);
        const pendingVisaApplications = await JobApplication.countDocuments({ visaStatus: { $in: ['Pending', 'In Progress'] } }).catch(() => 0);
        const pendingDeployments = await JobApplication.countDocuments({ deploymentStatus: 'Pending' }).catch(() => 0);
        const pendingContracts = 0;
        const pendingEmployerApprovals = 0;
        const pendingAgentApprovals = 0;
        const pendingPayments = await Payment.countDocuments({ status: 'pending' }).catch(() => 0);

        // Today's registrations
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaysRegistrations = await Candidate.countDocuments({ createdAt: { $gte: startOfDay } }).catch(() => 0);

        const todaysDeployments = await Deployment.countDocuments({ createdAt: { $gte: startOfDay }, deploymentStatus: { $in: ['Pending', 'Active'] } }).catch(() => 0);

        // Revenue summary - total paid payments
        const revenueAgg = await Payment.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).catch(() => []);
        const revenueSummary = (Array.isArray(revenueAgg) && revenueAgg[0] && revenueAgg[0].total) ? revenueAgg[0].total : 0;

        const announcementsDocs = await StaffNotification.find().sort({ createdAt: -1 }).limit(5).lean().catch(() => []);
        const announcements = Array.isArray(announcementsDocs) ? announcementsDocs.map(a => a.title || a.body).filter(Boolean) : [];

        const payload = {
          success: true,
          data: {
            totalOnlineUsers,
            activeChats,
            unreadMessages,
            pendingInterviews,
            pendingVisaApplications,
            pendingDeployments,
            pendingContracts,
            pendingEmployerApprovals,
            pendingAgentApprovals,
            pendingPayments,
            todaysRegistrations,
            todaysDeployments,
            revenueSummary,
            announcements,
          },
        };
        return res.json(payload);
      } catch (err) {
        // If any DB aggregation fails, fall back to memory state below
        console.warn('Dashboard DB aggregation failed, falling back to demo values:', err.message);
      }
    }

    // Fallback for non-connected mode or when DB aggregation fails
    const payload = {
      success: true,
      data: {
        totalOnlineUsers: memoryState.staff.length || 0,
        activeChats: conversations.length,
        unreadMessages,
        pendingInterviews: memoryState.supportTickets.length || 0,
        pendingVisaApplications: memoryState.applications.length || 0,
        pendingDeployments: memoryState.jobs.length || 0,
        pendingContracts: 0,
        pendingEmployerApprovals: 0,
        pendingAgentApprovals: 0,
        pendingPayments: 0,
        todaysRegistrations: memoryState.applications.length || 0,
        todaysDeployments: 0,
        revenueSummary: 0,
        announcements: memoryState.notifications.map(n => n.title || n.body).filter(Boolean),
      },
    };
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listChats(req, res) {
  try {
    await ensureDemoConversations();
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }
    const conversations = await StaffConversation.find().sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: conversations });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getChatById(req, res) {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }
    const conversation = await StaffConversation.findOne({ conversationId: id }).lean();
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const messages = await StaffMessage.find({ conversationId: id }).sort({ createdAt: 1 }).lean();
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
    if (error && error.message && error.message.toLowerCase().includes('database not connected')) {
      return res.status(503).json({ success: false, error: 'Database not connected - message not persisted' });
    }
    return res.status(400).json({ success: false, error: error.message });
  }
}

async function sendMessage(req, res) {
  try {
    const { conversationId, sender, text, senderName } = req.body;
    if (!conversationId || !sender || !text) {
      return res.status(400).json({ success: false, error: 'conversationId, sender and text are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    const message = await StaffMessage.create({ conversationId, sender: senderName || sender, text, type: 'text' });
    await StaffConversation.findOneAndUpdate(
      { conversationId },
      { lastMessage: text, lastActive: 'Just now', status: 'Replied' },
      { new: true }
    );
    await StaffNotification.create({ title: 'Staff reply sent', body: `${senderName || sender} replied to ${conversationId}`, type: 'chat' });

    return res.status(201).json({ success: true, data: message });
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
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, error: 'Database not connected' });

    const updated = await StaffConversation.findOneAndUpdate(
      { conversationId },
      { assignedTo, department: department || 'Customer Care' },
      { new: true }
    );
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function transferConversation(req, res) {
  try {
    const { conversationId, department, assignedTo } = req.body;
    if (!conversationId || !department) return res.status(400).json({ success: false, error: 'conversationId and department are required' });
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, error: 'Database not connected' });

    const updated = await StaffConversation.findOneAndUpdate({ conversationId }, { department, assignedTo }, { new: true });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function addInternalNote(req, res) {
  try {
    const { conversationId, note } = req.body;
    if (!conversationId || !note) return res.status(400).json({ success: false, error: 'conversationId and note are required' });
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, error: 'Database not connected' });

    const updated = await StaffConversation.findOneAndUpdate(
      { conversationId },
      { $push: { notes: note } },
      { new: true }
    );
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function broadcast(req, res) {
  try {
    const { message, targetGroup } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'message is required' });

    const payload = { title: 'Broadcast message', body: message, type: 'broadcast', targetGroup: targetGroup || 'All', read: false };
    if (mongoose.connection.readyState === 1) {
      await StaffNotification.create(payload);
    } else {
      memoryState.notifications.push(payload);
    }

    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function fetchNotifications(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }
    const notifications = await StaffNotification.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function performance(req, res) {
  try {
    return res.json({
      success: true,
      data: {
        openChats: 12,
        closedChats: 48,
        averageResponseTime: '2m 15s',
        averageResolutionTime: '15m',
        customerSatisfaction: '4.8/5',
        casesResolved: 36,
        dailyPerformance: 92,
        monthlyPerformance: 88,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  login,
  listStaffAccounts,
  createStaffAccount,
  dashboard,
  listChats,
  getChatById,
  receiveBlissAppMessage,
  sendMessage,
  uploadFile,
  assignConversation,
  transferConversation,
  addInternalNote,
  broadcast,
  fetchNotifications,
  performance,
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
};
