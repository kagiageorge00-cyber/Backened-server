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

const jwtAuth = require('../middleware/jwtAuth');

const JWT_SECRET = process.env.CANDIDATE_JWT_SECRET || 'candidate_secret_key';

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
    return res.json({
      success: true,
      data: {
        uniqueCode: candidate.uniqueCode || candidate._id,
        name: candidate.fullName || candidate.name,
        fullName: candidate.fullName || candidate.name,
        email: candidate.email,
        phone: candidate.phone,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/auth/profile', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const allowed = ['fullName', 'email', 'phone', 'country', 'nationality', 'skills', 'experience', 'gender', 'dateOfBirth', 'idNumber', 'county', 'education'];
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
    await candidate.save();
    return res.json({
      success: true,
      data: {
        uniqueCode: candidate.uniqueCode || candidate._id,
        name: candidate.fullName || candidate.name,
        fullName: candidate.fullName || candidate.name,
        email: candidate.email,
        phone: candidate.phone,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auth/forgot-password', async (req, res) => {
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
});

router.post('/auth/reset-password', async (req, res) => {
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
});

// -------------------------
// APPLICATIONS
// -------------------------
router.get('/applications', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const apps = await Application.find({ candidateId: candidate._id.toString() }).sort({ createdAt: -1 });
    return res.json({ success: true, data: apps });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/applications/:id', jwtAuth, async (req, res) => {
  try {
    const candidate = req.candidate;
    const app = await Application.findById(req.params.id);
    if (!app || app.candidateId.toString() !== candidate._id.toString()) return res.status(404).json({ success: false, error: 'Application not found' });
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
    return res.json({ success: true, data: convos });
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
    const notes = await Notification.find({ userId: candidate._id.toString() }).sort({ createdAt: -1 });
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
    await Notification.updateMany({ notificationId: { $in: ids }, userId: candidate._id.toString() }, { $set: { isRead: true } });
    return res.json({ success: true });
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
    // Heuristic-based progress
    let score = 10; // registration
    const docs = await Document.find({ candidateId: candidate._id.toString() });
    if (docs.length > 0) score += 25;
    if (candidate.isVerified) score += 20;
    const apps = await Application.find({ candidateId: candidate._id.toString() });
    if (apps.length > 0) score += 10;
    const interviews = await Interview.find({ candidateId: candidate._id.toString(), interviewStatus: 'accepted' });
    if (interviews.length > 0) score += 10;
    // cap max 100
    score = Math.min(100, score);
    return res.json({ success: true, data: { progress: score } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
