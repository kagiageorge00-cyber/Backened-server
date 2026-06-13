const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const Candidate = require('../models/candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Employer = require('../models/Employer');
const Job = require('../models/Job');

const jwtAuth = require('../middleware/jwtAuth');

const JWT_SECRET = process.env.CANDIDATE_JWT_SECRET || 'candidate_secret_key';

function normalizeCandidate(candidate) {
  if (!candidate) return null;
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  return {
    uniqueCode: candidateObj.uniqueCode || candidateObj.candidateId || (candidateObj._id ? candidateObj._id.toString() : null),
    candidateId: candidateObj.candidateId || candidateObj.uniqueCode || (candidateObj._id ? candidateObj._id.toString() : null),
    name: candidateObj.fullName || candidateObj.name,
    fullName: candidateObj.fullName || candidateObj.name,
    email: candidateObj.email,
    phone: candidateObj.phone,
    country: candidateObj.country,
    nationality: candidateObj.nationality,
    skills: candidateObj.skills || [],
    experience: candidateObj.experience,
    gender: candidateObj.gender,
    dateOfBirth: candidateObj.dateOfBirth,
    idNumber: candidateObj.idNumber,
    education: candidateObj.education,
    profilePhoto: candidateObj.profilePhoto || candidateObj.photoUrl,
    photoUrl: candidateObj.photoUrl,
    videoUrl: candidateObj.videoUrl,
    isVerified: candidateObj.isVerified,
    status: candidateObj.status,
    currentStatus: candidateObj.currentStatus,
    paymentStatus: candidateObj.paymentStatus,
    profileCompletion: candidateObj.profileCompletion || 0,
    createdAt: candidateObj.createdAt,
  };
}

function getCandidateIdentifiers(candidate) {
  return Array.from(
    new Set([
      candidate._id?.toString(),
      candidate.phone,
      candidate.email,
      candidate.uniqueCode,
      candidate.candidateId,
    ]
      .filter((id) => id != null && id.toString().trim().length > 0)
      .map((id) => id.toString())),
  );
}

async function enrichApplication(application) {
  const app = application.toObject ? application.toObject() : { ...application };
  const result = { ...app };
  if (app.jobId) {
    const job = await Job.findOne({ jobId: app.jobId }).lean();
    if (job) {
      result.job = {
        jobId: job.jobId,
        title: job.title,
        position: job.position,
        country: job.country,
        location: job.location,
        salary: job.salary,
        currency: job.currency,
        description: job.description,
        requirements: job.requirements,
        employerId: job.employerId,
        employerName: job.employerName,
        postedDate: job.postedDate,
      };
    }
  }
  if (app.employerId && !result.job?.employerName) {
    const employer = await Employer.findOne({ employerId: app.employerId }).lean();
    if (employer) {
      result.employer = {
        employerId: employer.employerId,
        companyName: employer.companyName,
        country: employer.country,
      };
    }
  }
  return result;
}

async function enrichInterview(interview) {
  const item = interview.toObject ? interview.toObject() : { ...interview };
  const result = { ...item };
  if (item.employerId) {
    const employer = await Employer.findOne({ employerId: item.employerId }).lean();
    if (employer) {
      result.employer = {
        employerId: employer.employerId,
        companyName: employer.companyName,
        country: employer.country,
      };
    }
  }
  if (item.interviewId) {
    const application = await Application.findOne({ interviewId: item.interviewId }).lean();
    if (application) {
      result.application = {
        applicationId: application._id.toString(),
        status: application.status,
        jobTitle: application.jobTitle,
        jobId: application.jobId,
      };
    }
  }
  return result;
}

function computeProfileCompletion(candidate) {
  const fields = ['fullName', 'email', 'phone', 'country', 'nationality', 'skills', 'experience', 'gender', 'dateOfBirth', 'idNumber', 'education'];
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const present = fields.reduce((count, key) => {
    const value = candidateObj[key];
    if (Array.isArray(value)) return value.length > 0 ? count + 1 : count;
    return value ? count + 1 : count;
  }, 0);
  return Math.min(100, Math.round((present / fields.length) * 100));
}

// multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'candidate_documents'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// -------------------------
// AUTH
// -------------------------
router.post('/auth/login', async (req, res) => {
  try {
    const { candidateId, password } = req.body;
    if (!candidateId || !password) return res.status(400).json({ success: false, error: 'candidateId and password required' });

    const candidate = await Candidate.findOne({ $or: [{ uniqueCode: candidateId }, { phone: candidateId }, { email: candidateId }] });
    if (!candidate) return res.status(401).json({ success: false, error: 'Candidate not found' });

    const match = await bcrypt.compare(password, candidate.password || '');
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: candidate._id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({
      success: true,
      token,
      data: {
        uniqueCode: candidate.uniqueCode || candidate._id,
        name: candidate.fullName || candidate.name,
        fullName: candidate.fullName || candidate.name,
        email: candidate.email,
        phone: candidate.phone
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auth/change-password', jwtAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const candidate = req.candidate;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, error: 'oldPassword and newPassword required' });
    const match = await bcrypt.compare(oldPassword, candidate.password || '');
    if (!match) return res.status(400).json({ success: false, error: 'Old password incorrect' });
    candidate.password = await bcrypt.hash(newPassword, 10);
    await candidate.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/auth/me', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    return res.json({ success: true, data: normalizeCandidate(candidate) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/auth/profile', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const allowed = ['fullName', 'email', 'phone', 'country', 'nationality', 'skills', 'experience', 'gender', 'dateOfBirth', 'idNumber', 'county', 'education', 'maritalStatus', 'numberOfChildren', 'religion', 'educationalLevel'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid profile fields provided' });
    }
    Object.assign(candidate, updates);
    candidate.profileCompletion = computeProfileCompletion(candidate);
    await candidate.save();
    return res.json({ success: true, data: normalizeCandidate(candidate) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/dashboard', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const identifiers = getCandidateIdentifiers(candidate);
    const docs = await Document.find({ candidateId: { $in: identifiers } }).sort({ createdAt: -1 }).lean();
    const interviews = await Interview.find({ candidateId: { $in: identifiers } }).sort({ interviewDate: -1 }).lean();
    const applications = await Application.find({ candidateId: { $in: identifiers } }).sort({ createdAt: -1 }).lean();
    const notifications = await Notification.find({ userId: { $in: identifiers } }).sort({ createdAt: -1 }).limit(5).lean();
    const upcomingInterview = interviews.find((item) => ['requested', 'accepted', 'scheduled'].includes(item.interviewStatus));
    const docsCount = docs.length;
    const appsCount = applications.length;
    const interviewsAccepted = interviews.filter((item) => item.interviewStatus === 'accepted').length;
    const progress = Math.min(100, 10 + (docsCount > 0 ? 20 : 0) + (candidate.isVerified ? 20 : 0) + (appsCount > 0 ? 15 : 0) + (interviewsAccepted > 0 ? 15 : 0) + (candidate.profileCompletion || 0));
    return res.json({
      success: true,
      data: {
        candidate: normalizeCandidate(candidate),
        summary: {
          activeApplications: applications.length,
          upcomingInterview: upcomingInterview ? {
            interviewId: upcomingInterview.interviewId,
            employerId: upcomingInterview.employerId,
            interviewDate: upcomingInterview.interviewDate,
            interviewTime: upcomingInterview.interviewTime,
            interviewStatus: upcomingInterview.interviewStatus,
            meetingLink: upcomingInterview.meetingLink,
          } : null,
          documentsUploaded: docsCount,
          notificationsUnread: notifications.filter((note) => !note.isRead).length,
          progress,
        },
        recentApplications: await Promise.all(applications.slice(0, 5).map(enrichApplication)),
        recentInterviews: await Promise.all(interviews.slice(0, 5).map(enrichInterview)),
        recentNotifications: notifications,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function handleForgotPassword(req, res) {
  try {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ success: false, error: 'candidateId required' });
    const candidate = await Candidate.findOne({ $or: [{ uniqueCode: candidateId }, { phone: candidateId }, { email: candidateId }] });
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    // generate temporary token (in production send via SMS/email)
    const resetToken = jwt.sign({ id: candidate._id }, JWT_SECRET, { expiresIn: '1h' });
    // store reset token on candidate (simple implementation)
    candidate.resetToken = resetToken;
    candidate.resetTokenExpires = Date.now() + 3600 * 1000;
    await candidate.save();
    return res.json({ success: true, resetToken });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleResetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ success: false, error: 'resetToken and newPassword required' });
    let decoded;
    try { decoded = jwt.verify(resetToken, JWT_SECRET); } catch (e) { return res.status(400).json({ success: false, error: 'Invalid token' }); }
    const candidate = await Candidate.findById(decoded.id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    if (candidate.resetToken !== resetToken || Date.now() > (candidate.resetTokenExpires || 0)) return res.status(400).json({ success: false, error: 'Token expired or invalid' });
    candidate.password = await bcrypt.hash(newPassword, 10);
    candidate.resetToken = null;
    candidate.resetTokenExpires = null;
    await candidate.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

router.post('/auth/forgot-password', handleForgotPassword);
router.post('/forgot-password', handleForgotPassword);
router.post('/auth/reset-password', handleResetPassword);
router.post('/reset-password', handleResetPassword);

// -------------------------
// APPLICATIONS
// -------------------------
router.get('/applications', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const identifiers = getCandidateIdentifiers(candidate);
    let apps = await Application.find({ candidateId: { $in: identifiers } }).sort({ createdAt: -1 }).lean();

    const hasFallbackApplication = !!(
      candidate.jobAppliedFor ||
      candidate.appliedJobId ||
      candidate.appliedJobTitle ||
      candidate.appliedEmployerId ||
      candidate.appliedEmployerName ||
      candidate.applicationDate
    );

    if (!apps.length && hasFallbackApplication) {
      const fallback = {
        _id: `REG-${candidate._id}`,
        candidateId: candidate._id.toString(),
        employerId: candidate.appliedEmployerId || 'unknown',
        jobId: candidate.appliedJobId || null,
        jobTitle: candidate.appliedJobTitle || candidate.jobAppliedFor || 'Registered Application',
        country: candidate.country || null,
        status: 'Submitted',
        applicationSource: 'registration',
        appliedEmployerName: candidate.appliedEmployerName || null,
        createdAt: candidate.applicationDate || candidate.createdAt,
        updatedAt: candidate.applicationDate || candidate.createdAt,
      };
      if (fallback.jobId) {
        const job = await Job.findOne({ jobId: fallback.jobId }).lean();
        if (job) {
          fallback.job = {
            jobId: job.jobId,
            title: job.title,
            position: job.position,
            country: job.country,
            location: job.location,
            salary: job.salary,
            currency: job.currency,
            description: job.description,
            requirements: job.requirements,
            employerId: job.employerId,
            employerName: job.employerName,
            postedDate: job.postedDate,
          };
        }
      }
      apps = [fallback];
    } else {
      apps = await Promise.all(apps.map(enrichApplication));
    }

    return res.json({ success: true, data: apps });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/applications/:id', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const identifiers = getCandidateIdentifiers(candidate);
    const id = req.params.id;
    let app = null;

    if (id.startsWith('REG-')) {
      if (candidate._id.toString() !== id.replace('REG-', '')) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }
      app = {
        _id: id,
        candidateId: candidate._id.toString(),
        employerId: candidate.appliedEmployerId || 'unknown',
        jobId: candidate.appliedJobId || null,
        jobTitle: candidate.appliedJobTitle || candidate.jobAppliedFor || 'Registered Application',
        country: candidate.country || null,
        status: 'Submitted',
        applicationSource: 'registration',
        appliedEmployerName: candidate.appliedEmployerName || null,
        createdAt: candidate.applicationDate || candidate.createdAt,
        updatedAt: candidate.applicationDate || candidate.createdAt,
      };
      if (app.jobId) {
        const job = await Job.findOne({ jobId: app.jobId }).lean();
        if (job) {
          app.job = {
            jobId: job.jobId,
            title: job.title,
            position: job.position,
            country: job.country,
            location: job.location,
            salary: job.salary,
            currency: job.currency,
            description: job.description,
            requirements: job.requirements,
            employerId: job.employerId,
            employerName: job.employerName,
            postedDate: job.postedDate,
          };
        }
      }
    } else {
      const application = await Application.findById(id);
      if (!application || !identifiers.includes(application.candidateId.toString())) return res.status(404).json({ success: false, error: 'Application not found' });
      app = await enrichApplication(application);
    }

    return res.json({ success: true, data: app });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// INTERVIEWS
// -------------------------
router.get('/interviews', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const interviews = await Interview.find({ candidateId: candidate._id.toString() }).sort({ interviewDate: -1 });
    return res.json({ success: true, data: interviews });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/interviews/:id/accept', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const interview = await Interview.findById(req.params.id);
    if (!interview || interview.candidateId.toString() !== candidate._id.toString()) return res.status(404).json({ success: false, error: 'Interview not found' });
    interview.interviewStatus = 'accepted';
    
    // Generate Agora channel and token if video/voice interview
    if (interview.interviewType && ['video', 'voice'].includes(interview.interviewType)) {
      interview.channelName = `interview_${interview._id}`;
      // TODO: Generate actual Agora token using Agora REST API
      // For now, use a placeholder token - in production, call Agora's token generation service
      interview.agoraToken = `token_${Date.now()}_placeholder`;
    }
    
    await interview.save();
    await Notification.create({ notificationId: `n_${Date.now()}`, userId: interview.employerId, userType: 'employer', title: 'Interview Accepted', message: `Candidate accepted interview ${interview.interviewId}` });
    return res.json({ success: true, data: interview });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/interviews/:id/decline', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const interview = await Interview.findById(req.params.id);
    if (!interview || interview.candidateId.toString() !== candidate._id.toString()) return res.status(404).json({ success: false, error: 'Interview not found' });
    interview.interviewStatus = 'declined';
    await interview.save();
    await Notification.create({ notificationId: `n_${Date.now()}`, userId: interview.employerId, userType: 'employer', title: 'Interview Declined', message: `Candidate declined interview ${interview.interviewId}` });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// PROFILE PHOTO
// -------------------------
router.post('/profile/photo', jwtAuth, upload.single('file'), async (req, res) => {
  try {
    const candidate = req.candidate;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/candidate_documents/${req.file.filename}`;
    const updated = await Candidate.findByIdAndUpdate(
      candidate._id,
      { photoUrl },
      { new: true }
    );
    return res.json({ success: true, photoUrl, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// DOCUMENTS
// -------------------------
router.post('/documents/upload', jwtAuth, upload.single('file'), async (req, res) => {
  try {
    const candidate = req.candidate;
    if (!req.file) return res.status(400).json({ success: false, error: 'File required' });
    const type = req.body.documentType || req.body.type || 'other';
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/candidate_documents/${req.file.filename}`;
    const doc = await Document.create({ candidateId: candidate._id.toString(), documentType: type, fileUrl, status: 'Uploaded' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/documents', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const docs = await Document.find({ candidateId: candidate._id.toString() }).sort({ createdAt: -1 });
    return res.json({ success: true, data: docs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/documents/:id', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.candidateId.toString() !== candidate._id.toString()) return res.status(404).json({ success: false, error: 'Document not found' });
    const { status } = req.body;
    if (status) doc.status = status;
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// MESSAGING (simple wrappers)
// -------------------------
router.get('/conversations', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const convos = await Conversation.find({ participants: candidate._id.toString() }).sort({ updatedAt: -1 });
    const enriched = await Promise.all(convos.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.toString() !== candidate._id.toString(),
      );
      let name = 'Conversation';
      if (otherParticipant === 'support') {
        name = 'Support Team';
      } else if (otherParticipant === 'employer') {
        name = 'Employer';
      } else if (typeof otherParticipant === 'string' && otherParticipant.startsWith('EMP-')) {
        name = 'Employer';
      } else if (typeof otherParticipant === 'string' && otherParticipant) {
        name = `Chat with ${otherParticipant}`;
      }
      const lastMessage = await Message.findOne({ conversationId: conv._id.toString() }).sort({ createdAt: -1 });
      return {
        ...conv.toObject(),
        name,
        lastMessage: lastMessage?.message || '',
      };
    }));
    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/conversations', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const { participants } = req.body;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ success: false, error: 'participants array required' });
    }
    const resolvedParticipants = Array.from(
      new Set([
        candidate._id.toString(),
        ...participants.map((p) => p.toString()),
      ]),
    );
    if (resolvedParticipants.length < 2) {
      return res.status(400).json({ success: false, error: 'At least two unique participants are required' });
    }
    const existing = await Conversation.findOne({
      participants: { $all: resolvedParticipants },
      $expr: { $eq: [{ $size: '$participants' }, resolvedParticipants.length] },
    });
    if (existing) {
      return res.json({ success: true, data: existing });
    }
    const conversationId = `CONV-${Date.now()}`;
    const conv = await Conversation.create({ conversationId, participants: resolvedParticipants });
    return res.status(201).json({ success: true, data: conv });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/conversations/:id/messages', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const conv = await Conversation.findById(req.params.id);
    if (!conv || !conv.participants.includes(candidate._id.toString())) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const { text } = req.body;
    const receiverId = conv.participants.find(p => p.toString() !== candidate._id.toString());
    const msg = await Message.create({ conversationId: conv._id, senderId: candidate._id.toString(), receiverId: receiverId || '', message: text });
    conv.updatedAt = Date.now();
    await conv.save();
    return res.json({ success: true, data: msg });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// NOTIFICATIONS
// -------------------------
router.get('/notifications', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const identifiers = [
      candidate._id?.toString(),
      candidate.phone,
      candidate.email,
      candidate.uniqueCode,
      candidate.candidateId,
    ].filter((id) => id != null && id.toString().trim().length > 0).map((id) => id.toString());
    const notes = await Notification.find({ userId: { $in: identifiers } }).sort({ createdAt: -1 });
    return res.json({ success: true, data: notes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/notifications/read', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const { ids } = req.body; // array of notification ids
    if (!Array.isArray(ids)) return res.status(400).json({ success: false, error: 'ids array required' });
    const identifiers = [
      candidate._id?.toString(),
      candidate.phone,
      candidate.email,
      candidate.uniqueCode,
      candidate.candidateId,
    ].filter((id) => id != null && id.toString().trim().length > 0).map((id) => id.toString());
    await Notification.updateMany({ notificationId: { $in: ids }, userId: { $in: identifiers } }, { $set: { isRead: true } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// OPPORTUNITIES (Jobs)
// -------------------------
router.get('/opportunities', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    // Return sample job opportunities; in production, fetch from Job model
    const opportunities = [
      {
        _id: 'JOB-001',
        jobTitle: 'Domestic Worker - Saudi Arabia',
        position: 'Housemaid',
        country: 'Saudi Arabia',
        salary: 1500,
        currency: 'SAR',
        employer: 'Gulf Staffing Solutions',
        employerId: 'EMP-001',
        description: 'Seeking experienced housemaid for villa in Riyadh. Accommodation and food provided.',
        requirements: '5+ years experience, references required',
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        _id: 'JOB-002',
        jobTitle: 'Nanny - United Arab Emirates',
        position: 'Childcare',
        country: 'United Arab Emirates',
        salary: 2000,
        currency: 'AED',
        employer: 'Premium Recruitment',
        employerId: 'EMP-002',
        description: 'Full-time nanny position for 2 children. Dubai location. English speaking preferred.',
        requirements: 'Experience with children 1-5 years, CPR certified',
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        _id: 'JOB-003',
        jobTitle: 'Caregiver - United States',
        position: 'Senior Care',
        country: 'United States',
        salary: 2500,
        currency: 'USD',
        employer: 'American Care Services',
        employerId: 'EMP-003',
        description: 'Live-in caregiver for elderly patient in New York. Flexible hours, competitive benefits.',
        requirements: 'Healthcare background, valid visa sponsorship',
        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
    return res.json({ success: true, data: opportunities });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/opportunities/:jobId/apply', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const { jobId } = req.params;
    const application = await Application.create({
      candidateId: candidate._id.toString(),
      jobId,
      status: 'Submitted',
      employerId: 'system',
    });
    return res.json({ success: true, data: application, message: 'Application submitted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// PROGRESS
// -------------------------
router.get('/progress', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const identifiers = getCandidateIdentifiers(candidate);
    // Heuristic-based progress
    let score = 10; // registration
    const docs = await Document.find({ candidateId: { $in: identifiers } });
    if (docs.length > 0) score += 25;
    if (candidate.isVerified) score += 20;
    const apps = await Application.find({ candidateId: { $in: identifiers } });
    if (apps.length > 0) score += 10;
    const interviews = await Interview.find({ candidateId: { $in: identifiers }, interviewStatus: 'accepted' });
    if (interviews.length > 0) score += 10;
    // cap max 100
    score = Math.min(100, score);
    return res.json({ success: true, data: { progress: score } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
