const express = require('express');
const Candidate = require('../models/candidate');

const router = express.Router();

const sendError = (res, status, error) => res.status(status).json({ success: false, error });

router.post('/', async (req, res) => {
  try {
    const { fullName, name, email, phone, country, skills, experience, photoUrl, videoUrl } = req.body || {};

    if (!email || !phone) {
      return sendError(res, 400, 'email and phone are required');
    }

    let candidate = await Candidate.findOne({ $or: [{ email }, { phone }] });

    const payload = {
      fullName: fullName || name || candidate?.fullName || '',
      name: name || fullName || candidate?.name || '',
      email,
      phone,
      country: country || candidate?.country || '',
      skills: skills || candidate?.skills || '',
      experience: experience || candidate?.experience || '',
      photoUrl: photoUrl || candidate?.photoUrl || '',
      videoUrl: videoUrl || candidate?.videoUrl || '',
      isVerified: candidate?.isVerified ?? false,
      status: 'in_process',
      paymentStatus: candidate?.paymentStatus || 'pending',
    };

    if (candidate) {
      candidate = await Candidate.findByIdAndUpdate(candidate._id, payload, { new: true, runValidators: true });
    } else {
      candidate = await Candidate.create(payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Application received successfully',
      data: candidate,
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to process application');
  }
});

module.exports = router;
