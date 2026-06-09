const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const crypto = require('crypto');

router.post('/request', async (req, res) => {
  try {
    const { employerId, candidateId, interviewDate, interviewTime, meetingLink, notes } = req.body;
    if (!employerId || !candidateId || !interviewDate) {
      return res.status(400).json({ success: false, error: 'employerId, candidateId and interviewDate are required' });
    }

    const interviewId = `INT-${Date.now()}`;
    const interview = await Interview.create({
      interviewId,
      employerId,
      candidateId,
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

router.get('/:employerId', async (req, res) => {
  try {
    const { employerId } = req.params;
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
