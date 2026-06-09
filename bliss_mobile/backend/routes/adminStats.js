const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Candidate = require('../models/candidate');
const Interview = require('../models/Interview');
const Deployment = require('../models/Deployment');
const Contract = require('../models/Contract');
const Visa = require('../models/Visa');
const Ticket = require('../models/Ticket');

router.get('/summary', async (req, res) => {
  try {
    const totalEmployers = await Employer.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const interviewsPending = await Interview.countDocuments({ interviewStatus: 'requested' });
    const deploymentsActive = await Deployment.countDocuments({ deploymentStatus: 'active' });
    const contractsPending = await Contract.countDocuments({ status: 'generated' });
    const visasPending = await Visa.countDocuments();
    const travelPending = await Ticket.countDocuments();
    const completedDeployments = await Deployment.countDocuments({ deploymentStatus: 'completed' });

    return res.json({
      success: true,
      data: {
        totalEmployers,
        totalCandidates,
        interviewsPending,
        deploymentsActive,
        contractsPending,
        visasPending,
        travelPending,
        completedDeployments,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
