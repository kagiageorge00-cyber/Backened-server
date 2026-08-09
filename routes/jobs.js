const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');
const Employer = require('../models/Employer');
const employerAuth = require('../middleware/employerAuth');
const jwt = require('jsonwebtoken');
const { verifyEmployerToken } = require('../services/jwtService');

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

// Shareable job preview for social links
router.get('/share/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ jobId });

    if (!job) {
      return res.status(404).send('<h1>Job not found</h1>');
    }

    const title = job.jobTitle || job.title || 'Global Job Opportunity';
    const summary = job.jobSummary || job.description || 'Explore this opportunity on Bliss Connect.';
    const images = [job.coverImage, ...(job.images || [])].filter(Boolean);
    const previewImage = images[0] || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80';
    const host = req.get('host');
    const protocol = req.protocol;
    const shareUrl = `${protocol}://${host}/api/jobs/share/${job.jobId}`;

    const imageTags = images
      .slice(0, 3)
      .map((src) => `<meta property="og:image" content="${src}" />`)
      .join('\n    ');

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${summary.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${summary.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="website" />
    ${imageTags}
    <meta property="og:url" content="${shareUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${summary.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${previewImage}" />
    <meta name="robots" content="index,follow" />
    <style>
      body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #050b1a; color: #f8fafc; }
      .page { display: grid; place-items: center; padding: 24px; }
      .preview-card { width: min(100%, 980px); border-radius: 30px; overflow: hidden; background: linear-gradient(180deg, rgba(10,25,63,0.95), rgba(7,17,31,0.98)); box-shadow: 0 30px 80px rgba(0,0,0,0.35); }
      .hero { position: relative; min-height: 420px; background: #0b1227; }
      .hero img { width: 100%; height: 420px; object-fit: cover; display: block; }
      .hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(7,17,31,0.92)); }
      .hero-label { position: absolute; left: 24px; bottom: 24px; z-index: 2; background: rgba(15, 23, 42, 0.82); color: #e2e8f0; padding: 10px 14px; border-radius: 999px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
      .thumbnails { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 18px 24px 0; background: #07111f; }
      .thumbnail { border-radius: 18px; overflow: hidden; background: #0a1221; aspect-ratio: 4/3; cursor: pointer; border: 2px solid transparent; }
      .thumbnail img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .thumbnail.active { border-color: #3b82f6; }
      .details { padding: 28px 32px 32px; display: grid; gap: 24px; }
      .brand-pill { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.08); color: #f8fafc; font-size: 12px; }
      .brand-pill::before { content: '★'; display: inline-block; color: #38bdf8; }
      .title { margin: 0; font-size: clamp(2rem, 2.5vw, 3rem); line-height: 1.05; }
      .meta { display: flex; flex-wrap: wrap; gap: 10px; color: #cbd5e1; font-size: 0.95rem; }
      .meta span { background: rgba(255,255,255,0.04); padding: 10px 14px; border-radius: 14px; }
      .summary { margin: 0; color: #e2e8f0; line-height: 1.8; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(148,163,184,0.12); border-radius: 22px; padding: 20px; }
      .card h3 { margin: 0 0 12px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; }
      .card p, .card ul { margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.7; }
      .card ul { padding-left: 18px; }
      .button-row { display: flex; flex-wrap: wrap; gap: 12px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px; border-radius: 14px; text-decoration: none; color: #fff; font-weight: 600; }
      .button.primary { background: linear-gradient(135deg, #38bdf8, #3b82f6); }
      .button.secondary { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); }
      .footer { padding: 20px 32px 28px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: #94a3b8; font-size: 0.92rem; }
      @media (max-width: 760px) { .hero { min-height: 280px; } .thumbnails { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <div class="page">
      <article class="preview-card">
        <section class="hero">
          <img id="heroImage" src="${previewImage}" alt="${title}" />
          <div class="hero-label">Bliss Connect | Global Talent Marketplace</div>
        </section>
        <section class="thumbnails">
          ${images
            .slice(0, 3)
            .map(
              (src, index) => `
              <button class="thumbnail${index === 0 ? ' active' : ''}" data-src="${src}" type="button">
                <img src="${src}" alt="${title} photo ${index + 1}" />
              </button>
            `,
            )
            .join('')}
        </section>
        <div class="details">
          <div>
            <span class="brand-pill">Job preview</span>
            <h1 class="title">${title}</h1>
            <p class="meta">
              <span>${job.employerName || 'Company listing'}</span>
              <span>${job.city || job.location || 'Remote / Global'}</span>
              <span>${job.country || 'International'}</span>
              <span>${job.employmentType || 'Flexible'}</span>
            </p>
            <p class="summary">${summary}</p>
          </div>
          <div class="grid">
            <div class="card">
              <h3>Opportunity details</h3>
              <p>Salary: ${job.currency || 'USD'} ${job.salary || 'Negotiable'}</p>
              <p>Vacancies: ${job.numberOfVacancies || job.vacancies || 'Multiple'}</p>
              <p>Deadline: ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Open'}</p>
            </div>
            <div class="card">
              <h3>What makes it strong</h3>
              <ul>
                <li>${job.jobSummary ? 'Clear role description' : 'Strong global demand'}</li>
                <li>${job.requiredSkills?.length ? job.requiredSkills.slice(0, 3).join(', ') : 'High-value skills'}</li>
                <li>${job.workLocation || 'Flexible work mode'}</li>
              </ul>
            </div>
          </div>
          <div class="button-row">
            <a class="button primary" href="${shareUrl}">View this job on Bliss Connect</a>
            <a class="button secondary" href="mailto:?subject=${encodeURIComponent('Job opportunity: ' + title)}&body=${encodeURIComponent(summary + ' \n\n View this role: ' + shareUrl)}">Email link</a>
          </div>
        </div>
        <footer class="footer">
          <span>Job ID: ${job.jobId}</span>
          <span>Shared via Bliss Connect</span>
        </footer>
      </article>
    </div>
    <script>
      const thumbnails = document.querySelectorAll('.thumbnail');
      const hero = document.getElementById('heroImage');
      thumbnails.forEach((button) => {
        button.addEventListener('click', () => {
          thumbnails.forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
          hero.src = button.dataset.src;
        });
      });
    </script>
  </body>
</html>`;

    return res.send(html);
  } catch (err) {
    console.error('Job share preview error:', err);
    return res.status(500).send('<h1>Unable to load job preview</h1>');
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

// Delete Job (employer owner or staff)
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization required' });
    }

    const token = authHeader.toString().replace(/^Bearer\s+/i, '');

    const job = await Job.findOne({ jobId });
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    let authorized = false;

    // Try employer token
    try {
      const decoded = verifyEmployerToken(token);
      if (decoded && decoded.employerId) {
        const employer = await Employer.findOne({ employerId: decoded.employerId });
        if (employer && employer.employerId === job.employerId) {
          authorized = true;
        }
      }
    } catch (err) {
      // not employer token
    }

    // Try staff token
    if (!authorized) {
      try {
        const staffJwtSecret = process.env.JWT_SECRET || 'bliss-staff-secret';
        const staffDecoded = jwt.verify(token, staffJwtSecret);
        if (staffDecoded) {
          authorized = true;
        }
      } catch (err) {
        // not staff token
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this job' });
    }

    // Remove job and related resources
    await Job.deleteOne({ jobId });
    await JobApplication.deleteMany({ jobId });
    await Notification.deleteMany({ entityType: 'job', entityId: jobId });

    return res.json({ success: true, message: 'Job deleted successfully', jobId });
  } catch (err) {
    console.error('Job delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
