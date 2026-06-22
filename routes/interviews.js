const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Candidate = require('../models/candidate');
const employerAuth = require('../middleware/employerAuth');
const crypto = require('crypto');

router.post('/request', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer || employer.status !== 'active' || !['verified_employer', 'active_employer'].includes(employer.verificationStatus)) {
      return res.status(403).json({ success: false, error: 'Employer account is not verified or active' });
    }

    const { candidateId, interviewDate, interviewTime, meetingLink, notes } = req.body;
    if (!candidateId || !interviewDate) {
      return res.status(400).json({ success: false, error: 'candidateId and interviewDate are required' });
    }

    const candidate = await Candidate.findOne({
      $or: [
        { candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId },
      ],
    });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    if (!candidate.isVerified || candidate.status !== 'available') {
      return res.status(400).json({ success: false, error: 'Candidate is not verified or currently unavailable for interview' });
    }

    const interviewId = `INT-${Date.now()}`;
    const interview = await Interview.create({
      interviewId,
      employerId: employer.employerId,
      candidateId: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      interviewDate: new Date(interviewDate),
      interviewTime,
      meetingLink,
      notes,
    });

    return res.status(201).json({ success: true, data: interview });
  } catch (err) {
    console.error('Interview request error:', err);
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

    // notify employer
    const Notification = require('../models/Notification');
    await Notification.create({
      notificationId: `NTF-${Date.now()}`,
      userId: interview.employerId,
      userType: 'employer',
      title: `Interview ${interview.interviewStatus}`,
      message: `Candidate ${candidateId} has ${interview.interviewStatus} the interview.`,
      notificationType: 'interview_response',
      actionUrl: `/employer/interviews/${interview.interviewId}`
    });

    return res.json({ success: true, data: interview });
  } catch (err) {
    console.error('Interview respond error:', err);
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
