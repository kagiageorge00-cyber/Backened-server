const express = require('express');
const Candidate = require('../models/candidate');

const router = express.Router();

const toCandidatePayload = (body = {}, existing = null) => {
  const payload = {
    fullName: body.fullName ?? body.name ?? existing?.fullName ?? existing?.name ?? '',
    name: body.name ?? body.fullName ?? existing?.name ?? existing?.fullName ?? '',
    email: body.email ?? existing?.email ?? '',
    phone: body.phone ?? existing?.phone ?? '',
    country: body.country ?? existing?.country ?? '',
    skills: body.skills ?? existing?.skills ?? '',
    experience: body.experience ?? existing?.experience ?? '',
    photoUrl: body.photoUrl ?? existing?.photoUrl ?? '',
    videoUrl: body.videoUrl ?? existing?.videoUrl ?? '',
    passportUrl: body.passportUrl ?? existing?.passportUrl ?? '',
    medicalUrl: body.medicalUrl ?? existing?.medicalUrl ?? '',
    resumeUrl: body.resumeUrl ?? existing?.resumeUrl ?? '',
    additionalUrl: body.additionalUrl ?? existing?.additionalUrl ?? '',
    isVerified: body.isVerified ?? existing?.isVerified ?? false,
    status: body.status ?? existing?.status ?? 'available',
    paymentStatus: body.paymentStatus ?? existing?.paymentStatus ?? 'pending',
  };

  const uniqueCode = body.uniqueCode || body.candidateId || existing?.uniqueCode;
  if (uniqueCode) {
    payload.uniqueCode = uniqueCode;
  }

  return payload;
};

const sendError = (res, status, error) => res.status(status).json({ success: false, error });

router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: candidates.length, data: candidates });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to fetch candidates');
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = toCandidatePayload(req.body);

    if (!payload.fullName || !payload.email || !payload.phone) {
      return sendError(res, 400, 'fullName, email and phone are required');
    }

    const existing = await Candidate.findOne({ $or: [{ email: payload.email }, { phone: payload.phone }] });
    if (existing) {
      return sendError(res, 409, 'Candidate already exists');
    }

    const candidate = await Candidate.create(payload);
    return res.status(201).json({ success: true, message: 'Candidate created successfully', data: candidate });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to create candidate');
  }
});

router.get('/marketplace', async (req, res) => {
  try {
    const candidates = await Candidate.find({ isVerified: true, status: 'available' }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: candidates.length, data: candidates });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to fetch marketplace candidates');
  }
});

router.put('/:id/documents', async (req, res) => {
  try {
    const {
      passportUrl,
      photoUrl,
      videoUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
    } = req.body;

    let existing = await Candidate.findById(req.params.id);
    if (!existing && req.params.id.startsWith('BLISS-')) {
      existing = await Candidate.findOne({ uniqueCode: req.params.id });
    }

    if (!existing) return sendError(res, 404, 'Candidate not found');

    const payload = {
      passportUrl: passportUrl ?? existing.passportUrl,
      photoUrl: photoUrl ?? existing.photoUrl,
      videoUrl: videoUrl ?? existing.videoUrl,
      medicalUrl: medicalUrl ?? existing.medicalUrl,
      resumeUrl: resumeUrl ?? existing.resumeUrl,
      additionalUrl: additionalUrl ?? existing.additionalUrl,
    };

    const candidate = await Candidate.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    });

    if (!candidate) return sendError(res, 404, 'Candidate not found');
    return res.status(200).json({ success: true, message: 'Candidate documents updated successfully', data: candidate });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to update candidate documents');
  }
});

router.get('/:id', async (req, res) => {
  try {
    let candidate = await Candidate.findById(req.params.id);
    if (!candidate && req.params.id.startsWith('BLISS-')) {
      candidate = await Candidate.findOne({ uniqueCode: req.params.id });
    }
    if (!candidate) return sendError(res, 404, 'Candidate not found');
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to fetch candidate');
  }
});

router.put('/:id', async (req, res) => {
  try {
    let existing = await Candidate.findById(req.params.id);
    if (!existing && req.params.id.startsWith('BLISS-')) {
      existing = await Candidate.findOne({ uniqueCode: req.params.id });
    }

    if (!existing) return sendError(res, 404, 'Candidate not found');

    const payload = toCandidatePayload(req.body, existing);
    const candidate = await Candidate.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true });
    if (!candidate) return sendError(res, 404, 'Candidate not found');
    return res.status(200).json({ success: true, message: 'Candidate updated successfully', data: candidate });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to update candidate');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return sendError(res, 404, 'Candidate not found');
    return res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to delete candidate');
  }
});

module.exports = router;
