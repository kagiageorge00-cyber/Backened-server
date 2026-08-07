const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Candidate = require('../models/candidate');
const Notification = require('../models/Notification');
const employerAuth = require('../middleware/employerAuth');
const crypto = require('crypto');
const { generateRtcSession } = require('../services/rtcService');

const asyncCandidateLookup = async (candidateId) => {
  if (!candidateId) return null;
  return Candidate.findOne({
    $or: [
      { candidateId },
      { uniqueCode: candidateId },
      { phone: candidateId },
      { email: candidateId },
      { _id: candidateId },
    ],
  });
};

const createInterviewNotification = async ({
  userId,
  userType,
  title,
  message,
  interview,
  actionUrl,
}) => {
  await Notification.create({
    notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    userType,
    title,
    message,
    notificationType: 'interview',
    category: 'interview',
    entityType: 'interview',
    entityId: interview.interviewId,
    actionUrl,
  });
};

router.post('/request', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer || employer.status !== 'active' || !['verified_employer', 'active_employer'].includes(employer.verificationStatus)) {
      return res.status(403).json({ success: false, error: 'Employer account is not verified or active' });
    }

    const {
      candidateId,
      interviewDate,
      interviewTime,
      meetingLink,
      notes,
      interviewType = 'video',
    } = req.body;
    if (!candidateId || !interviewDate) {
      return res.status(400).json({ success: false, error: 'candidateId and interviewDate are required' });
    }

    const candidate = await asyncCandidateLookup(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    if (!candidate.isVerified || candidate.status !== 'available') {
      return res.status(400).json({ success: false, error: 'Candidate is not verified or currently unavailable for interview' });
    }

    const normalizedInterviewType = ['video', 'voice'].includes(String(interviewType).toLowerCase())
      ? String(interviewType).toLowerCase()
      : 'video';

    const interviewId = `INT-${Date.now()}`;
    const channelName = `interview_${interviewId}`;
    const rtcSession = normalizedInterviewType === 'text'
      ? { provider: 'none', token: null, channelName, uid: 0 }
      : await generateRtcSession({ interviewId, channelName, uid: 0, interviewType: normalizedInterviewType });

    const interview = await Interview.create({
      interviewId,
      employerId: employer.employerId,
      candidateId: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      interviewDate: new Date(interviewDate),
      interviewTime,
      interviewType: normalizedInterviewType,
      meetingLink: meetingLink || `https://meet.blissconnect.local/${crypto.randomUUID()}`,
      notes,
      channelName: rtcSession.channelName,
      agoraToken: rtcSession.token,
      meetingStatus: 'scheduled',
      interviewStatus: 'requested',
    });

    await createInterviewNotification({
      userId: candidate._id.toString(),
      userType: 'candidate',
      title: 'Interview scheduled',
      message: `Your interview with ${employer.companyName || employer.fullName || 'the employer'} has been scheduled for ${interviewDate}${interviewTime ? ` at ${interviewTime}` : ''}.`,
      interview,
      actionUrl: `/candidate/interviews/${interview.interviewId}`,
    });

    return res.status(201).json({ success: true, interview });
  } catch (err) {
    console.error('Interview request error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const list = await Interview.find({ employerId: employer.employerId }).sort({ createdAt: -1 });
    const hydrated = await Promise.all(list.map(async (item) => {
      const candidate = await asyncCandidateLookup(item.candidateId);
      return {
        ...item.toObject(),
        candidateName: candidate?.fullName || candidate?.candidateName || 'Candidate',
      };
    }));
    return res.json({ success: true, data: hydrated });
  } catch (err) {
    console.error('Interview list error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:employerId', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { employerId } = req.params;
    if (employer.employerId !== employerId) {
      return res.status(403).json({ success: false, error: 'Employer access denied' });
    }
    const list = await Interview.find({ employerId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('Interview list error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get interviews for a candidate
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (!candidateId) return res.status(400).json({ success: false, error: 'candidateId required' });

    const list = await Interview.find({ candidateId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('Interview by candidate error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Candidate responds to an interview (accept/decline)
router.post('/:interviewId/respond', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { candidateId, response } = req.body; // response: 'accepted' | 'declined'
    if (!interviewId || !candidateId || !response) return res.status(400).json({ success: false, error: 'interviewId, candidateId and response required' });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found' });

    interview.interviewStatus = response === 'accepted' ? 'accepted' : 'declined';
    await interview.save();

    await createInterviewNotification({
      userId: interview.employerId,
      userType: 'employer',
      title: `Interview ${interview.interviewStatus}`,
      message: `Candidate ${candidateId} has ${interview.interviewStatus} the interview.`,
      interview,
      actionUrl: `/employer/interviews/${interview.interviewId}`,
    });

    return res.json({ success: true, data: interview });
  } catch (err) {
    console.error('Interview respond error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:interviewId/start', employerAuth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findOne({ interviewId, employerId: req.employer.employerId });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found' });

    interview.meetingStatus = 'active';
    interview.interviewStatus = 'accepted';
    if (interview.interviewType && ['video', 'voice'].includes(interview.interviewType)) {
      const rtcSession = await generateRtcSession({
        interviewId: interview.interviewId,
        channelName: interview.channelName || `interview_${interview.interviewId}`,
        uid: 0,
        interviewType: interview.interviewType,
      });
      interview.channelName = rtcSession.channelName;
      interview.agoraToken = interview.agoraToken || rtcSession.token;
    }
    await interview.save();

    await createInterviewNotification({
      userId: interview.candidateId,
      userType: 'candidate',
      title: 'Interview started',
      message: `The employer has started your ${interview.interviewType || 'interview'}. Please join when ready.`,
      interview,
      actionUrl: `/candidate/interviews/${interview.interviewId}`,
    });

    return res.json({ success: true, interview });
  } catch (err) {
    console.error('Interview start error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:interviewId/notes', employerAuth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { notes } = req.body;
    const interview = await Interview.findOne({ interviewId, employerId: req.employer.employerId });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found' });

    interview.notes = notes || '';
    await interview.save();

    return res.json({ success: true, interview });
  } catch (err) {
    console.error('Interview note save error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:interviewId/decision', employerAuth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { decision, reason } = req.body;
    const interview = await Interview.findOne({ interviewId, employerId: req.employer.employerId });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found' });

    const normalizedDecision = String(decision || '').toLowerCase();
    interview.interviewStatus = normalizedDecision === 'passed' ? 'passed' : 'failed';
    interview.decisionReason = reason || '';
    interview.meetingStatus = 'ended';
    await interview.save();

    const candidate = await asyncCandidateLookup(interview.candidateId);
    if (candidate) {
      const nextStatus = normalizedDecision === 'passed' ? 'selected' : 'available';
      await Candidate.findOneAndUpdate(
        { $or: [{ candidateId: interview.candidateId }, { uniqueCode: interview.candidateId }, { _id: interview.candidateId }, { phone: interview.candidateId }, { email: interview.candidateId }] },
        { $set: { status: nextStatus } },
        { new: true }
      );
    }

    const outcomeMessage = normalizedDecision === 'passed'
      ? `You have been selected for the opportunity after the interview.`
      : `The employer has decided not to proceed with your application at this time.`;

    await createInterviewNotification({
      userId: interview.candidateId,
      userType: 'candidate',
      title: normalizedDecision === 'passed' ? 'Interview result: selected' : 'Interview result: not selected',
      message: outcomeMessage,
      interview,
      actionUrl: `/candidate/interviews/${interview.interviewId}`,
    });

    await createInterviewNotification({
      userId: interview.employerId,
      userType: 'employer',
      title: normalizedDecision === 'passed' ? 'Candidate selected' : 'Candidate not selected',
      message: normalizedDecision === 'passed'
        ? `You selected ${candidate?.fullName || interview.candidateId}.`
        : `You marked ${candidate?.fullName || interview.candidateId} as not selected.`,
      interview,
      actionUrl: `/employer/interviews/${interview.interviewId}`,
    });

    return res.json({ success: true, interview });
  } catch (err) {
    console.error('Interview decision error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create or generate a meeting link for an interview
router.post('/:interviewId/meeting', async (req, res) => {
  try {
    const { interviewId } = req.params;
    if (!interviewId) return res.status(400).json({ success: false, error: 'interviewId required' });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found' });

    const meetingLink = `https://meet.blissconnect.local/${crypto.randomUUID()}`;
    interview.meetingLink = meetingLink;
    await interview.save();

    return res.json({ success: true, meetingLink, data: interview });
  } catch (err) {
    console.error('Meeting create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
