const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const Candidate = require('../models/candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Deployment = require('../models/Deployment');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Staff = require('../models/Staff');
const StaffConversation = require('../models/StaffConversation');
const StaffNotification = require('../models/StaffNotification');
const Employer = require('../models/Employer');
const Job = require('../models/Job');

const jwtAuth = require('../middleware/jwtAuth');
const { getCandidatePortalGreetingName, getCandidateNameValue } = require('../utils/candidateDisplayName');
const {
  generateRtcSession,
  normalizeInterviewType,
} = require('../services/rtcService');
const { emitToUser } = require('../inbox/socket/socketService');
const inboxUpload = require('../inbox/middlewares/uploadMiddleware');
const { ingestIncomingBlissAppMessage } = require('../services/staffOperationsBridge');

const JWT_SECRET = process.env.CANDIDATE_JWT_SECRET || 'candidate_secret_key';

function normalizeCandidate(candidate) {
  if (!candidate) return null;
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const birthDate = candidateObj.dateOfBirth ? new Date(candidateObj.dateOfBirth) : null;
  const age = birthDate && !Number.isNaN(birthDate.getTime())
    ? new Date().getFullYear() - birthDate.getFullYear()
    : null;
  return {
    uniqueCode: candidateObj.uniqueCode || candidateObj.candidateId || (candidateObj._id ? candidateObj._id.toString() : null),
    candidateId: candidateObj.candidateId || candidateObj.uniqueCode || (candidateObj._id ? candidateObj._id.toString() : null),
    name: getCandidateNameValue(candidateObj),
    fullName: getCandidateNameValue(candidateObj),
    email: candidateObj.email,
    phone: candidateObj.phone,
    country: candidateObj.country,
    nationality: candidateObj.nationality,
    religion: candidateObj.religion,
    gender: candidateObj.gender,
    dateOfBirth: candidateObj.dateOfBirth,
    age,
    idNumber: candidateObj.idNumber,
    education: candidateObj.education,
    educationalLevel: candidateObj.educationalLevel,
    experience: candidateObj.experience,
    skills: candidateObj.skills || [],
    languages: candidateObj.languages || [],
    maritalStatus: candidateObj.maritalStatus,
    numberOfChildren: candidateObj.numberOfChildren,
    jobPosition: candidateObj.jobPosition,
    jobType: candidateObj.jobType,
    isInternational: candidateObj.isInternational === true,
    destinationCountry: candidateObj.destinationCountry,
    destinationPreference: candidateObj.destinationPreference,
    expectedSalary: candidateObj.expectedSalary,
    profilePhoto: candidateObj.profilePhoto || candidateObj.photoUrl,
    photoUrl: candidateObj.photoUrl,
    videoUrl: candidateObj.videoUrl,
    passportUrl: candidateObj.passportUrl,
    medicalUrl: candidateObj.medicalUrl,
    resumeUrl: candidateObj.resumeUrl,
    additionalUrl: candidateObj.additionalUrl,
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
  // Uses same marketplace fields as calculateProfileCompletion in candidateRoutes.js
  const fields = [
    'photoUrl',
    'nationality',
    'religion',
    'education',
    'experience',
    'skills',
    'languages',
    'dateOfBirth',
    'jobPosition',
    'expectedSalary',
    'destinationCountry',
  ];
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const present = fields.reduce((count, key) => {
    const value = candidateObj[key];
    if (Array.isArray(value)) return value.length > 0 ? count + 1 : count;
    return value ? count + 1 : count;
  }, 0);
  return Math.round((present / fields.length) * 100);
}

// multer setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bliss-connect/candidate-documents',
    resource_type: 'auto',
  },
});
const upload = multer({ storage });

// -------------------------
// AUTH
// -------------------------
router.post('/auth/login', async (req, res) => {
  try {
    const { candidateId, password } = req.body;
    const loginId = typeof candidateId === 'string' ? candidateId.trim() : '';
    if (!loginId || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'candidateId and password required' });
    }

    const escapedLoginId = loginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const candidateCode = new RegExp(`^${escapedLoginId}$`, 'i');
    const candidate = await Candidate.findOne({
      $or: [
        { uniqueCode: candidateCode },
        { candidateId: candidateCode },
        { phone: loginId },
        { email: loginId },
      ],
    });
    if (!candidate) return res.status(401).json({ success: false, error: 'Candidate not found' });

    const match = await bcrypt.compare(password, candidate.password || '');
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: candidate._id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({
      success: true,
      token,
      data: {
        uniqueCode: candidate.uniqueCode || candidate._id,
        name: getCandidatePortalGreetingName(candidate),
        fullName: getCandidatePortalGreetingName(candidate),
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
    const allowed = [
      'fullName',
      'email',
      'phone',
      'country',
      'nationality',
      'skills',
      'experience',
      'gender',
      'dateOfBirth',
      'idNumber',
      'county',
      'education',
      'educationalLevel',
      'maritalStatus',
      'numberOfChildren',
      'religion',
      'jobPosition',
      'jobType',
      'isInternational',
      'destinationCountry',
      'destinationPreference',
      'expectedSalary',
      'languages',
    ];
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
    const requestedCandidateCode = (req.query.candidateCode || req.query.candidateId || '').toString().trim();
    let candidate = req.candidate;

    if (requestedCandidateCode) {
      const resolvedCandidate = await Candidate.findOne({
        $or: [
          { uniqueCode: requestedCandidateCode },
          { candidateId: requestedCandidateCode },
          { phone: requestedCandidateCode },
          { email: requestedCandidateCode },
        ],
      });
      if (resolvedCandidate) {
        candidate = resolvedCandidate;
      }
    }

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
    
    // Generate a RTC channel and token if video/voice interview
    const interviewType = normalizeInterviewType(interview.interviewType);
    if (interviewType === 'video' || interviewType === 'voice') {
      const rtcSession = await generateRtcSession({
        interviewId: interview.interviewId,
        channelName: interview.channelName || `interview_${interview.interviewId}`,
        uid: 0,
        interviewType,
      });
      interview.channelName = rtcSession.channelName;
      interview.rtcAppId = rtcSession.appId;
      interview.agoraToken = rtcSession.token;
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
    const photoUrl = req.file.secure_url || req.file.path;
    if (!/^https?:\/\//i.test(photoUrl || '')) {
      return res.status(502).json({ success: false, error: 'Cloudinary did not return a preview URL' });
    }
    const updated = await Candidate.findByIdAndUpdate(
      candidate._id,
      { photoUrl },
      { new: true }
    );
    return res.json({ success: true, photoUrl, previewUrl: photoUrl, data: updated });
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
    const fileUrl = req.file.secure_url || req.file.path;
    if (!/^https?:\/\//i.test(fileUrl || '')) {
      return res.status(502).json({ success: false, error: 'Cloudinary did not return a preview URL' });
    }
    const doc = await Document.create({ candidateId: candidate._id.toString(), documentType: type, fileUrl, status: 'Uploaded' });
    return res.json({ success: true, url: fileUrl, previewUrl: fileUrl, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/documents', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    
    // Fetch uploaded documents
    const uploadedDocs = await Document.find({ 
      candidateId: candidate._id.toString() 
    }).sort({ createdAt: -1 }).lean();

    // Build profile documents from candidate model
    const profileDocs = [];
    
    // Photo document
    if (candidate.photoUrl) {
      profileDocs.push({
        _id: `PROFILE-PHOTO-${candidate._id}`,
        candidateId: candidate._id.toString(),
        documentType: 'photo',
        fileUrl: candidate.photoUrl,
        status: 'Verified',
        createdAt: candidate.createdAt || new Date(),
        source: 'profile'
      });
    }
    
    // Passport document
    if (candidate.passportUrl) {
      profileDocs.push({
        _id: `PROFILE-PASSPORT-${candidate._id}`,
        candidateId: candidate._id.toString(),
        documentType: 'passport',
        fileUrl: candidate.passportUrl,
        status: 'Verified',
        createdAt: candidate.createdAt || new Date(),
        source: 'profile'
      });
    }
    
    // Medical document
    if (candidate.medicalUrl) {
      profileDocs.push({
        _id: `PROFILE-MEDICAL-${candidate._id}`,
        candidateId: candidate._id.toString(),
        documentType: 'medical',
        fileUrl: candidate.medicalUrl,
        status: 'Verified',
        createdAt: candidate.createdAt || new Date(),
        source: 'profile'
      });
    }
    
    // Video/Introduction document
    if (candidate.videoUrl) {
      profileDocs.push({
        _id: `PROFILE-VIDEO-${candidate._id}`,
        candidateId: candidate._id.toString(),
        documentType: 'video',
        fileUrl: candidate.videoUrl,
        status: 'Verified',
        createdAt: candidate.createdAt || new Date(),
        source: 'profile'
      });
    }
    
    // Resume
    if (candidate.resumeUrl) {
      profileDocs.push({
        _id: `PROFILE-RESUME-${candidate._id}`,
        candidateId: candidate._id.toString(),
        documentType: 'resume',
        fileUrl: candidate.resumeUrl,
        status: 'Verified',
        createdAt: candidate.createdAt || new Date(),
        source: 'profile'
      });
    }
    
    // Merge: profile docs first (existing), then uploaded docs (new)
    const allDocs = [...profileDocs, ...uploadedDocs].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return res.json({ success: true, data: allDocs, count: allDocs.length });
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
    const employerIds = Array.from(new Set(convos.flatMap((conversation) =>
      conversation.participants
        .map((participant) => String(participant))
        .filter((participant) => participant.startsWith('EMP-')),
    )));
    const employers = employerIds.length
      ? await Employer.find({ employerId: { $in: employerIds } })
        .select('employerId companyName fullName')
        .lean()
      : [];
    const employerNames = new Map(employers.map((employer) => [
      employer.employerId,
      employer.companyName || employer.fullName || 'Employer',
    ]));
    const enriched = await Promise.all(convos.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.toString() !== candidate._id.toString(),
      );
      let name = 'Conversation';
      let conversationType = 'conversation';
      if (otherParticipant === 'support') {
        name = 'Support Team';
        conversationType = 'support';
      } else if (otherParticipant === 'employer') {
        name = 'Employer';
        conversationType = 'employer';
      } else if (typeof otherParticipant === 'string' && otherParticipant.startsWith('EMP-')) {
        name = employerNames.get(otherParticipant) || 'Employer';
        conversationType = 'employer';
      } else if (typeof otherParticipant === 'string' && otherParticipant) {
        name = `Chat with ${otherParticipant}`;
      }
      const lastMessage = await Message.findOne({ conversationId: conv._id.toString() }).sort({ createdAt: -1 });
      return {
        ...conv.toObject(),
        name,
        conversationType,
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

router.get('/conversations/:id/messages', jwtAuth, async (req, res) => {
  try {
    const candidateId = req.candidate._id.toString();
    const conversation = await Conversation.findById(req.params.id).lean();
    if (!conversation || !conversation.participants.some((id) => String(id) === candidateId)) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    const messages = await Message.find({ conversationId: conversation._id.toString() })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/conversations/:id/attachments', jwtAuth, inboxUpload.single('file'), async (req, res) => {
  try {
    const candidateId = req.candidate._id.toString();
    const conversation = await Conversation.findById(req.params.id).lean();
    if (!conversation || !conversation.participants.some((id) => String(id) === candidateId)) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    if (!req.file?.path) {
      return res.status(400).json({ success: false, error: 'Please select a file to upload.' });
    }
    return res.status(201).json({
      success: true,
      data: {
        url: req.file.path,
        name: req.file.originalname || req.file.filename || 'Attachment',
        mimeType: req.file.mimetype || '',
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/conversations/:id/messages', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const conv = await Conversation.findById(req.params.id);
    const candidateId = candidate._id.toString();
    if (!conv || !conv.participants.some((id) => String(id) === candidateId)) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    const text = String(req.body.text || '').trim();
    const attachmentUrl = String(req.body.attachmentUrl || '').trim();
    const attachmentName = String(req.body.attachmentName || '').trim();
    const attachmentMimeType = String(req.body.attachmentMimeType || '').trim();
    if (!text && !attachmentUrl) {
      return res.status(400).json({ success: false, error: 'A message or attachment is required.' });
    }
    const receiverId = conv.participants.find((id) => String(id) !== candidateId);
    const sourceMessageId = String(req.body.clientMessageId || crypto.randomUUID());
    let msg = await Message.findOne({ sourceMessageId });
    if (msg && msg.conversationId !== conv._id.toString()) {
      return res.status(409).json({ success: false, error: 'Message identifier is already in use.' });
    }
    const isNewMessage = !msg;
    const employerId = isNewMessage
      ? conv.participants.find((id) =>
        String(id) !== candidateId && String(id).startsWith('EMP-'),
      )
      : null;
    if (employerId) {
      const candidateIdentifiers = getCandidateIdentifiers(candidate);
      const [hasDeployment, activeInterview] = await Promise.all([
        Deployment.findOne({
          employerId: String(employerId),
          candidateId: { $in: candidateIdentifiers },
          currentStage: { $in: ['Contract', 'Visa', 'Active', 'Deployed'] },
          adminVerified: true,
        }),
        Interview.findOne({
          employerId: String(employerId),
          candidateId: { $in: candidateIdentifiers },
          chatChannelId: conv._id.toString(),
          interviewStatus: 'accepted',
          meetingStatus: 'active',
        }),
      ]);
      if (!hasDeployment && !activeInterview) {
        return res.status(403).json({
          success: false,
          error: 'Messaging is available during an active interview or approved deployment.',
        });
      }
    }
    if (!msg) {
      msg = await Message.create({
        conversationId: conv._id.toString(),
        senderId: candidateId,
        receiverId: String(receiverId || ''),
        senderType: 'candidate',
        message: text || (attachmentName ? `Shared ${attachmentName}` : 'Attachment'),
        messageType: attachmentMimeType.startsWith('image/')
          ? 'image'
          : attachmentMimeType.startsWith('video/')
            ? 'video'
            : attachmentUrl ? 'document' : 'text',
        attachmentUrl,
        attachmentName,
        attachmentMimeType,
        sourceMessageId,
      });
    }
    conv.updatedAt = Date.now();
    await conv.save();
    const isSupportConversation = conv.participants.some((id) => ['support', 'staff'].includes(String(id).toLowerCase()));
    if (isSupportConversation) {
      await ingestIncomingBlissAppMessage({
        sourceMessageId,
        conversationId: `bliss-app-${candidateId}`,
        blissAppConversationId: conv._id.toString(),
        userId: candidateId,
        blissId: candidate.uniqueCode || candidate.candidateId || candidateId,
        userType: 'Candidate',
        customerName: getCandidateNameValue(candidate),
        customerEmail: candidate.email,
        customerPhone: candidate.phone,
        country: candidate.country,
        message_text: text || msg.message,
        message_type: msg.messageType,
        channel: 'bliss_app',
        attachmentUrl,
        attachmentName,
        attachmentMimeType,
      });
    } else if (employerId) {
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        userId: String(employerId),
        userType: 'employer',
        entityType: 'message',
        entityId: msg._id.toString(),
        notificationType: 'message',
        category: 'message',
        title: 'New Message from Candidate',
        message: `You have a new message from ${getCandidateNameValue(candidate)}.`,
        actionUrl: `/employer/messages/${conv._id.toString()}`,
        isRead: false,
        createdAt: new Date(),
      });
    }
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/conversations/:id/call', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const candidateId = candidate._id.toString();
    const conversation = await Conversation.findById(req.params.id).lean();
    if (
      !conversation ||
      !conversation.participants.some((id) => String(id) === candidateId) ||
      !conversation.participants.some((id) => ['support', 'staff'].includes(String(id).toLowerCase()))
    ) {
      return res.status(404).json({ success: false, error: 'Support conversation not found' });
    }

    const customerName = getCandidateNameValue(candidate);
    let staffConversation = await StaffConversation.findOne({
      blissAppConversationId: String(conversation._id),
    });
    if (!staffConversation) {
      const identity = [];
      if (candidate.phone) identity.push({ customerPhone: candidate.phone });
      if (candidate.email) identity.push({ customerEmail: candidate.email });
      if (candidate.uniqueCode || candidate.candidateId) {
        identity.push({ blissId: candidate.uniqueCode || candidate.candidateId });
      }
      if (identity.length) staffConversation = await StaffConversation.findOne({ $or: identity });
    }
    if (!staffConversation) {
      staffConversation = await StaffConversation.create({
        conversationId: `bliss-app-${candidateId}`,
        blissAppConversationId: String(conversation._id),
        customerName,
        customerEmail: candidate.email || '',
        customerPhone: candidate.phone || '',
        blissId: candidate.uniqueCode || candidate.candidateId || candidateId,
        userType: 'Candidate',
        country: candidate.country || '',
        status: 'New',
        priority: 'Normal',
        department: 'Customer Care',
        queueType: 'Unclassified',
        queueName: 'Unclassified',
        unreadCount: 0,
        lastMessage: '',
        lastActive: 'Just now',
      });
    } else if (staffConversation.blissAppConversationId !== String(conversation._id)) {
      staffConversation.blissAppConversationId = String(conversation._id);
      await staffConversation.save();
    }

    const channelName = `bliss_support_${crypto.randomUUID().replace(/-/g, '')}`;
    const customerUid = crypto.randomInt(1, 2147483647);
    let staffUid = crypto.randomInt(1, 2147483647);
    if (staffUid === customerUid) staffUid = staffUid === 2147483647 ? 1 : staffUid + 1;
    const [customerRtc, staffRtc] = await Promise.all([
      generateRtcSession({ channelName, uid: customerUid, interviewType: 'voice' }),
      generateRtcSession({ channelName, uid: staffUid, interviewType: 'voice' }),
    ]);

    const assignedTo = String(staffConversation.assignedTo || '').trim();
    let staffAccounts = assignedTo
      ? await Staff.find({ $or: [{ email: assignedTo }, { fullName: assignedTo }], isActive: { $ne: false } })
          .select('email')
          .lean()
      : [];
    if (!staffAccounts.length) {
      staffAccounts = await Staff.find({
        department: staffConversation.department || 'Customer Care',
        isActive: { $ne: false },
      }).select('email').lean();
    }
    const recipients = [...new Set(staffAccounts.map((staff) => String(staff.email || '').trim()).filter(Boolean))];
    if (!recipients.length) {
      return res.status(503).json({ success: false, error: 'No support staff are currently available for calls.' });
    }

    const callId = crypto.randomUUID();
    const call = {
      callId,
      conversationId: staffConversation.conversationId,
      candidateUserId: candidateId,
      customerName,
      channelName,
      appId: staffRtc.appId,
      token: staffRtc.token,
      uid: staffRtc.uid,
      videoEnabled: false,
      createdAt: new Date().toISOString(),
    };
    staffConversation.activeCall = {
      callId,
      candidateUserId: candidateId,
      status: 'ringing',
      channelName,
      createdAt: call.createdAt,
    };
    await staffConversation.save();
    await StaffNotification.create({
      title: 'Incoming voice call',
      body: `${customerName} is calling Bliss support.`,
      type: 'call',
      conversationId: staffConversation.conversationId,
    });
    for (const recipient of recipients) {
      emitToUser(recipient, 'incomingCall', call);
      await Notification.create({
        notificationId: `CALL-${callId}-${recipient}`,
        userId: recipient,
        userType: 'staff',
        title: 'Incoming voice call',
        message: `${customerName} is calling Bliss support.`,
        notificationType: 'support_call',
        category: 'message',
        entityType: 'conversation',
        entityId: staffConversation.conversationId,
      });
    }
    return res.status(201).json({
      success: true,
      data: {
        callId,
        conversationId: staffConversation.conversationId,
        channelName: customerRtc.channelName,
        appId: customerRtc.appId,
        token: customerRtc.token,
        uid: customerRtc.uid,
      },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.put('/conversations/:id/call-status', jwtAuth, async (req, res) => {
  try {
    const candidateId = req.candidate._id.toString();
    const conversation = await Conversation.findById(req.params.id).lean();
    if (
      !conversation ||
      !conversation.participants.some((id) => String(id) === candidateId) ||
      !conversation.participants.some((id) => ['support', 'staff'].includes(String(id).toLowerCase()))
    ) {
      return res.status(404).json({ success: false, error: 'Support conversation not found' });
    }
    const { callId, status } = req.body || {};
    if (!callId || status !== 'ended') {
      return res.status(400).json({ success: false, error: 'A callId and ended status are required.' });
    }
    const staffConversation = await StaffConversation.findOne({
      blissAppConversationId: String(conversation._id),
      'activeCall.candidateUserId': candidateId,
      'activeCall.callId': callId,
    });
    if (!staffConversation) {
      return res.status(404).json({ success: false, error: 'Voice call not found' });
    }
    staffConversation.activeCall = {
      ...staffConversation.activeCall,
      status: 'ended',
      updatedAt: new Date().toISOString(),
    };
    await staffConversation.save();
    const assignedTo = String(staffConversation.assignedTo || '').trim();
    let recipients = assignedTo
      ? await Staff.find({ $or: [{ email: assignedTo }, { fullName: assignedTo }], isActive: { $ne: false } })
          .select('email')
          .lean()
      : [];
    if (!recipients.length) {
      recipients = await Staff.find({
        department: staffConversation.department || 'Customer Care',
        isActive: { $ne: false },
      }).select('email').lean();
    }
    for (const recipient of recipients) {
      if (recipient.email) emitToUser(String(recipient.email).trim().toLowerCase(), 'callStatus', {
        callId,
        conversationId: staffConversation.conversationId,
        status: 'ended',
      });
    }
    return res.json({ success: true, data: staffConversation.activeCall });
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
    const identifiers = Array.from(
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
    const notes = await Notification.find({
      userType: 'candidate',
      userId: { $in: identifiers },
    })
      .sort({ createdAt: -1 })
      .lean();
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
