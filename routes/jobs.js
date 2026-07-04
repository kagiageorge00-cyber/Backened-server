const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');
const { employerAuth } = require('../middleware/auth');

// Generate Job ID
function generateJobId() {
  return `JOB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
}

// Generate Application ID
function generateApplicationId() {
  return `APP-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

// Create Job (Draft)
router.post('/create', employerAuth, async (req, res) => {
  try {
    const jobData = req.body;
    const jobId = generateJobId();
    
    const job = await Job.create({
      jobId,
      employerId: req.employer.employerId,
      employerName: req.employer.companyName || 'Unnamed Company',
      employerLogo: req.employer.companyLogo,
      employerRating: req.employer.rating || 4.5,
      employerVerified: req.employer.verified || false,
      status: 'Draft',
      qualityScore: 0,
      ...jobData,
    });

    return res.status(201).json({
      success: true,
      jobId,
      data: job,
      message: 'Job draft created. Complete and publish when ready.',
    });
  } catch (err) {
    console.error('Job creation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create job',
    });
  }
});

// Publish Job
router.post('/:jobId/publish', employerAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify employer owns this job
    const job = await Job.findOne({ jobId, employerId: req.employer.employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Verify employer is verified
    if (!req.employer.verified) {
      return res.status(403).json({
        success: false,
        error: 'Complete employer verification before posting jobs',
        requiresVerification: true,
      });
    }

    // Calculate quality score
    let qualityScore = 0;
    if (job.jobTitle && job.jobTitle.length > 10) qualityScore += 10;
    if (job.jobSummary && job.jobSummary.length > 50) qualityScore += 10;
    if (job.keyResponsibilities && job.keyResponsibilities.length > 0) qualityScore += 15;
    if (job.requiredSkills && job.requiredSkills.length > 0) qualityScore += 15;
    if (job.qualifications && job.qualifications.length > 20) qualityScore += 10;
    if (job.salary > 0) qualityScore += 15;
    if (Object.values(job.benefits).some(v => v)) qualityScore += 10;
    if (job.jobCategory && job.jobCategory.length > 0) qualityScore += 5;

    // Update job status
    const updatedJob = await Job.findOneAndUpdate(
      { jobId },
      {
        status: 'Active',
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        qualityScore: Math.min(qualityScore, 100),
      },
      { new: true }
    );

    return res.json({
      success: true,
      jobId,
      data: updatedJob,
      message: 'Congratulations! Your job has been published successfully.',
      qualityScore: Math.min(qualityScore, 100),
    });
  } catch (err) {
    console.error('Job publish error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Get Employer's Jobs
router.get('/employer', employerAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.employer.employerId })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      jobs,
    });
  } catch (err) {
    console.error('Fetch jobs error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Get Marketplace Jobs
router.get('/marketplace', async (req, res) => {
  try {
    const { country, jobCategory, employmentType, page = 1, limit = 20 } = req.query;

    const filter = { status: 'Active' };
    if (country) filter.country = country;
    if (jobCategory) filter.jobCategory = jobCategory;
    if (employmentType) filter.employmentType = employmentType;

    const jobs = await Job.find(filter)
      .sort({ featured: -1, publishedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    return res.json({
      success: true,
      jobs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Marketplace jobs fetch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Get Job Details
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Increment views
    await Job.updateOne({ jobId }, { $inc: { viewsCount: 1 } });

    return res.json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('Job details fetch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Update Job
router.post('/:jobId/update', employerAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = req.body;

    // Verify ownership
    const job = await Job.findOne({ jobId, employerId: req.employer.employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or not owned by you',
      });
    }

    const updated = await Job.findOneAndUpdate(
      { jobId },
      { ...jobData, updatedAt: new Date() },
      { new: true }
    );

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('Job update error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Pause Job
router.post('/:jobId/pause', employerAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ jobId, employerId: req.employer.employerId });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await Job.updateOne({ jobId }, { status: 'Paused' });

    return res.json({
      success: true,
      message: 'Job paused successfully',
    });
  } catch (err) {
    console.error('Job pause error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Close Job
router.post('/:jobId/close', employerAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ jobId, employerId: req.employer.employerId });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await Job.updateOne({ jobId }, { status: 'Closed' });

    return res.json({
      success: true,
      message: 'Job closed successfully',
    });
  } catch (err) {
    console.error('Job close error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Get Job Applications
router.get('/:jobId/applications', employerAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify ownership
    const job = await Job.findOne({ jobId, employerId: req.employer.employerId });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const applications = await JobApplication.find({ jobId })
      .sort({ appliedAt: -1 });

    return res.json({
      success: true,
      applications,
    });
  } catch (err) {
    console.error('Applications fetch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Apply for Job
router.post('/:jobId/apply', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { candidateId, candidateName, candidateEmail, coverLetter } = req.body;

    if (!candidateId || !candidateName || !candidateEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const job = await Job.findOne({ jobId, status: 'Active' });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Check if already applied
    const existing = await JobApplication.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You have already applied for this job',
      });
    }

    const applicationId = generateApplicationId();
    const application = await JobApplication.create({
      applicationId,
      jobId,
      candidateId,
      employerId: job.employerId,
      candidateName,
      candidateEmail,
      jobTitle: job.jobTitle,
      status: 'Applied',
      coverLetter,
      appliedAt: new Date(),
    });

    // Increment job applications count
    await Job.updateOne({ jobId }, { $inc: { applicationsCount: 1 } });

    // Notify employer
    const notificationId = `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    await Notification.create({
      notificationId,
      userId: job.employerId,
      userType: 'employer',
      entityType: 'job_application',
      entityId: applicationId,
      title: 'New Application Received',
      message: `${candidateName} has applied for your ${job.jobTitle} position`,
      actionUrl: `/employer/jobs/${jobId}/applications`,
      status: 'unread',
    });

    return res.status(201).json({
      success: true,
      applicationId,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (err) {
    console.error('Job application error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Shortlist Application
router.post('/applications/:applicationId/shortlist', employerAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findOne({ applicationId });
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Verify ownership
    if (application.employerId !== req.employer.employerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const updated = await JobApplication.findOneAndUpdate(
      { applicationId },
      { status: 'Shortlisted', shortlistedAt: new Date() },
      { new: true }
    );

    // Update job shortlist count
    await Job.updateOne(
      { jobId: application.jobId },
      { $inc: { shortlistedCount: 1 } }
    );

    // Notify candidate
    const notificationId = `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    await Notification.create({
      notificationId,
      userId: application.candidateId,
      userType: 'candidate',
      entityType: 'job_application',
      entityId: applicationId,
      title: 'You\'ve Been Shortlisted!',
      message: `Great news! You\'ve been shortlisted for ${application.jobTitle}`,
      actionUrl: `/candidate/applications/${applicationId}`,
      status: 'unread',
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Candidate shortlisted',
    });
  } catch (err) {
    console.error('Shortlist error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
