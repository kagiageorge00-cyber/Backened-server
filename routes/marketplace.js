const express = require('express');
const jwt = require('jsonwebtoken');
const Candidate = require('../models/candidate');
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');
const employerAuth = require('../middleware/employerAuth');
const { getCandidateNameValue } = require('../utils/candidateDisplayName');
const { buildCandidateMarketplaceProfile } = require('../services/candidateMarketplaceService');
const router = express.Router();

function isAuthenticatedStaff(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  try {
    const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'bliss-staff-secret');
    return decoded && (decoded.staffId || decoded.role === 'staff' || decoded.userType === 'staff');
  } catch (error) {
    return false;
  }
}

function executeQuery(queryBuilder, options = {}) {
  let query = queryBuilder;
  if (query && typeof query.sort === 'function') {
    query = query.sort(options.sort || {});
  }
  if (query && options.skip !== undefined && typeof query.skip === 'function') {
    query = query.skip(options.skip);
  }
  if (query && options.limit !== undefined && typeof query.limit === 'function') {
    query = query.limit(options.limit);
  }
  if (query && options.select !== undefined && typeof query.select === 'function') {
    return query.select(options.select);
  }
  return query;
}

function requireVerifiedEmployer(req, res) {
  const employer = req.employer;
  if (!employer || employer.status !== 'active' || !['verified_employer', 'active_employer'].includes(employer.verificationStatus)) {
    res.status(403).json({ success: false, error: 'Employer account is not verified or active' });
    return false;
  }
  return true;
}

function normalizeMarketplaceCandidate(candidate, employerRequirements = {}) {
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const profile = buildCandidateMarketplaceProfile(candidateObj, employerRequirements);
  profile.name = profile.fullName;
  profile.jobPosition = profile.preferredJobPosition;
  profile.experience = profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : null;
  profile.expectedSalary = profile.expectedSalary;
  profile.destinationCountry = profile.preferredCountry;
  profile.destinationPreference = profile.preferredCountry;
  profile.profileCompletion = candidateObj.profileCompletion || 0;
  profile.photoUrl = profile.photoUrl || candidateObj.photoUrl;
  profile.profilePhoto = profile.photoUrl;
  profile.profilePhotoUrl = profile.photoUrl;
  profile.imageUrl = profile.photoUrl;
  profile.avatarUrl = profile.photoUrl;
  profile.languagesLabel = Array.isArray(candidateObj.languages) && candidateObj.languages.length ? candidateObj.languages.join(', ') : null;
  profile.skillsLabel = Array.isArray(candidateObj.skills) && candidateObj.skills.length ? candidateObj.skills.join(', ') : null;
  profile.availability = profile.availabilityStatus;
  profile.availabilityBadge = candidateObj.isVerified ? 'Verified' : 'Pending';
  profile.verified = Boolean(candidateObj.isVerified);
  profile.verificationBadge = profile.verificationBadge || 'Verified Candidate';
  profile.matchScore = profile.matchScore || 0;
  return profile;
}

// GET /api/marketplace/candidates
router.get('/candidates', async (req, res) => {
  try {

    const {
      country,
      skills,
      experience,
      verified,
      page = 1,
      limit = 20,
      search,
      availability,
      salary,
      jobPosition,
      language,
      verifiedOnly,
    } = req.query;
    const query = { isVerified: true, status: { $in: ['available', 'in_process', 'approved'] } };

    if (country) query.$or = [
      { country: { $regex: country, $options: 'i' } },
      { destinationCountry: { $regex: country, $options: 'i' } },
    ];
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { fullName: regex },
        { name: regex },
        { uniqueCode: regex },
        { jobPosition: regex },
        { jobAppliedFor: regex },
        { skills: { $in: [regex] } },
      ];
    }
    if (jobPosition) query.jobPosition = { $regex: jobPosition, $options: 'i' };
    if (experience) query.experience = { $regex: experience, $options: 'i' };
    if (skills) query.skills = { $in: skills.split(',').map((s) => s.trim()) };
    if (language) query.languages = { $in: [language] };
    if (availability) query.status = availability === 'available' ? 'available' : query.status;
    if (salary) query.expectedSalary = { $regex: salary, $options: 'i' };
    if (verifiedOnly === 'true') query.isVerified = true;
    if (verified !== undefined && verified !== 'true') {
      return res.status(400).json({ success: false, error: 'Marketplace only returns verified candidates' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const candidates = await executeQuery(Candidate.find(query), {
      sort: { createdAt: -1 },
      skip,
      limit: Number(limit),
      select: '-password',
    });
    const employerRequirements = {
      skills: skills ? skills.split(',').map((s) => s.trim()) : [],
      experience: Number(experience || 0),
      country: country || '',
    };

    return res.json({ success: true, data: candidates.map((candidate) => normalizeMarketplaceCandidate(candidate, employerRequirements)), count: candidates.length });
  } catch (err) {
    console.error('Marketplace error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, country, skills, experience, jobPosition, language, page = 1, limit = 20 } = req.query;
    const searchTerm = q || req.query.search || '';
    const query = { isVerified: true, status: { $in: ['available', 'in_process', 'approved'] } };
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [{ fullName: regex }, { name: regex }, { uniqueCode: regex }, { jobPosition: regex }, { jobAppliedFor: regex }, { country: regex }, { destinationCountry: regex }];
    }
    if (country) query.$or = [{ country: { $regex: country, $options: 'i' } }, { destinationCountry: { $regex: country, $options: 'i' } }];
    if (jobPosition) query.jobPosition = { $regex: jobPosition, $options: 'i' };
    if (experience) query.experience = { $regex: experience, $options: 'i' };
    if (skills) query.skills = { $in: skills.split(',').map((s) => s.trim()) };
    if (language) query.languages = { $in: [language] };
    const skip = (Number(page) - 1) * Number(limit);
    const list = await executeQuery(Candidate.find(query), {
      sort: { createdAt: -1 },
      skip,
      limit: Number(limit),
      select: '-password',
    });
    return res.json({ success: true, data: list.map((candidate) => normalizeMarketplaceCandidate(candidate)) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/filter', async (req, res) => {
  try {
    const filters = { isVerified: true, status: { $in: ['available', 'in_process', 'approved'] } };
    if (req.query.country) {
      filters.$or = [{ country: { $regex: req.query.country, $options: 'i' } }, { destinationCountry: { $regex: req.query.country, $options: 'i' } }];
    }
    if (req.query.jobCategory) filters.jobPosition = { $regex: req.query.jobCategory, $options: 'i' };
    if (req.query.experience) filters.experience = { $regex: req.query.experience, $options: 'i' };
    if (req.query.availability) filters.status = req.query.availability === 'available' ? 'available' : filters.status;
    const list = await executeQuery(Candidate.find(filters), {
      sort: { createdAt: -1 },
      limit: 20,
      select: '-password',
    });
    return res.json({ success: true, data: list.map((candidate) => normalizeMarketplaceCandidate(candidate)) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recommended', async (req, res) => {
  try {
    const candidates = await executeQuery(Candidate.find({ isVerified: true, status: { $in: ['available', 'in_process', 'approved'] } }), {
      sort: { createdAt: -1 },
      limit: 6,
      select: '-password',
    });
    const employerRequirements = {
      skills: req.query.skills ? req.query.skills.split(',').map((s) => s.trim()) : [],
      experience: Number(req.query.experience || 0),
      country: req.query.country || '',
    };
    return res.json({ success: true, data: candidates.map((candidate) => normalizeMarketplaceCandidate(candidate, employerRequirements)) });
  } catch (err) {
    console.error('Recommended marketplace error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/candidates/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    const query = {
      $or: [
        { candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId },
      ],
    };
    if (!isAuthenticatedStaff(req)) {
      query.isVerified = true;
      query.status = { $in: ['available', 'in_process', 'approved'] };
    }

    const candidate = await Candidate.findOne(query).select('-password');
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const profile = normalizeMarketplaceCandidate(candidate, {
      skills: Array.isArray(candidate.skills) ? candidate.skills : [],
      experience: Number(candidate.experience || 0),
      country: candidate.destinationCountry || candidate.country || '',
    });
    const contactInfo = candidate.contactReleased
      ? {
          email: candidate.email,
          phone: candidate.phone,
          nationality: candidate.nationality,
        }
      : null;

    return res.json({
      success: true,
      data: {
        ...profile,
        contactReleased: candidate.contactReleased,
        contactInfo,
        privateAccess: candidate.contactReleased,
      },
    });
  } catch (err) {
    console.error('Marketplace candidate detail error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/candidates/bookmark', employerAuth, async (req, res) => {
  try {
    if (!requireVerifiedEmployer(req, res)) return;

    const { candidateId, candidateCode, fullName, photoUrl } = req.body;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { employerId: req.employer.employerId, candidateId },
      { employerId: req.employer.employerId, candidateId, candidateCode, fullName, photoUrl },
      { upsert: true, new: true }
    );

    await Notification.create({
      notificationId: `NTF-${Date.now()}`,
      userId: req.employer.employerId,
      userType: 'employer',
      title: 'Candidate saved',
      message: `${fullName || 'Candidate'} was saved to your shortlist.`,
      notificationType: 'candidate',
      category: 'candidate',
      entityType: 'candidate',
      entityId: candidateId,
    });

    return res.status(201).json({ success: true, data: bookmark });
  } catch (err) {
    console.error('Bookmark error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/bookmarks', employerAuth, async (req, res) => {
  try {
    if (!requireVerifiedEmployer(req, res)) return;

    const bookmarks = await Bookmark.find({ employerId: req.employer.employerId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: bookmarks });
  } catch (err) {
    console.error('Bookmark list error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
