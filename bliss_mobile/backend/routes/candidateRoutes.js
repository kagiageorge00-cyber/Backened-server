const express = require('express');
const Candidate = require('../models/candidate');
const sendEmail = require('../email');
const bcrypt = require('bcryptjs');

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
      isVerified: true,
      status: 'available', // Available for marketplace
      paymentStatus: 'completed',
    };

    const candidate = await Candidate.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    });

    if (!candidate) return sendError(res, 404, 'Candidate not found');

    // ⚡ RETURN IMMEDIATELY (don't wait for email)
    res.status(200).json({ 
      success: true, 
      message: 'Candidate documents updated successfully and profile registered', 
      data: candidate 
    });

    // ⚡ STEP 5 & 6: Send final registration confirmation email in background
    setImmediate(async () => {
      try {
        if (!candidate.email) {
          console.warn('⚠️ No email for candidate', candidate._id);
          return;
        }

        // Generate portal password (if not exists)
        const portalPassword = candidate.password || Math.random().toString(36).substring(2, 10);
        const portalUrl = `${process.env.FRONTEND_URL || 'https://blisssconnect12.netlify.app'}/candidatePortal?candidateId=${encodeURIComponent(candidate.uniqueCode)}`;

        console.log('📧 Sending registration confirmation to', candidate.email);

        const confirmationMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <h2 style="color: #4CAF50; text-align: center;">🎉 Registration Complete!</h2>
              
              <p>Hello ${candidate.name || 'Candidate'},</p>
              <p>Congratulations! Your registration is now complete and your profile has been posted to the Bliss Connect marketplace! 🚀</p>
              
              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #2e7d32;"><strong>Your Unique Code:</strong> <code style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 3px; font-size: 14px;">${candidate.uniqueCode}</code></p>
                <p style="margin: 5px 0; color: #2e7d32;"><strong>Portal Password:</strong> <code style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 3px; font-size: 14px;">${portalPassword}</code></p>
              </div>
              
              <p style="background-color: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; color: #856404; margin: 15px 0;">
                <strong>⚠️ Important:</strong> Keep these credentials safe. You will need them to access your candidate portal.
              </p>
              
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>✅ Your profile is now visible to employers in our marketplace</li>
                <li>📧 You will receive notifications when employers express interest</li>
                <li>💼 Access your portal to track applications and opportunities</li>
              </ul>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">Access Candidate Portal</a>
              </p>
              
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #666;"><strong>Portal Link:</strong><br/><code style="word-break: break-all;">${portalUrl}</code></p>
              </div>
              
              <h3 style="color: #2196F3; margin-top: 30px;">Your Profile Highlights:</h3>
              <ul style="color: #666;">
                <li><strong>Status:</strong> Active and Visible to Employers</li>
                <li><strong>Documents:</strong> Verified and Complete</li>
                <li><strong>Marketplace:</strong> Listed and Featured</li>
              </ul>
              
              <p style="color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                If you did not register for this service or have any questions, please contact our support team.
              </p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
                Bliss Connect Team<br/>
                <a href="https://blisssconnect12.netlify.app" style="color: #4CAF50; text-decoration: none;">Visit our website</a>
              </p>
            </div>
          </div>
        `;

        await sendEmail(
          candidate.email,
          "🎉 Registration Complete - Your Profile is Now Live!",
          `Hello ${candidate.name || 'Candidate'},\n\nCongratulations! Your registration is complete.\n\nYour Unique Code: ${candidate.uniqueCode}\nYour Portal Password: ${portalPassword}\n\nYour profile is now visible to employers.\n\nAccess your portal: ${portalUrl}\n\nBest regards,\nBliss Connect Team`,
          confirmationMessage
        );

        console.log('✅ Registration confirmation email sent to', candidate.email);

      } catch (err) {
        console.error('❌ Error sending registration email:', err.message);
        // Don't fail the request - it's already returned
      }
    });

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

// ============================================
// GET CANDIDATE FORM DATA (FOR FRONTEND FORM)
// ============================================
router.get('/form/data', async (req, res) => {
  try {
    const { candidateId } = req.query;
    if (!candidateId) {
      return sendError(res, 400, 'candidateId query parameter required');
    }

    let candidate = await Candidate.findOne({
      $or: [
        { _id: candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId }
      ]
    });

    if (!candidate) {
      return sendError(res, 404, 'Candidate not found');
    }

    return res.status(200).json({
      success: true,
      data: candidate,
      formLink: `${process.env.FRONTEND_URL || 'https://blisssconnect12.netlify.app'}/candidate-form?candidateId=${candidateId}`
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to fetch candidate form data');
  }
});

// ============================================
// SUBMIT CANDIDATE FORM (VERIFIED AFTER PAYMENT)
// ============================================
router.post('/form/submit', async (req, res) => {
  try {
    const { candidateId, fullName, email, phone, country, skills, experience, passportUrl, photoUrl, videoUrl, medicalUrl, resumeUrl, additionalUrl } = req.body;

    if (!candidateId) {
      return sendError(res, 400, 'candidateId is required');
    }

    let candidate = await Candidate.findOne({
      $or: [
        { _id: candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId }
      ]
    });

    if (!candidate) {
      return sendError(res, 404, 'Candidate not found');
    }

    // Update candidate with form data
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidate._id,
      {
        fullName: fullName || candidate.fullName,
        email: email || candidate.email,
        phone: phone || candidate.phone,
        country: country || candidate.country,
        skills: skills || candidate.skills,
        experience: experience || candidate.experience,
        passportUrl: passportUrl || candidate.passportUrl,
        photoUrl: photoUrl || candidate.photoUrl,
        videoUrl: videoUrl || candidate.videoUrl,
        medicalUrl: medicalUrl || candidate.medicalUrl,
        resumeUrl: resumeUrl || candidate.resumeUrl,
        additionalUrl: additionalUrl || candidate.additionalUrl,
        isVerified: true,
        status: 'available',
        paymentStatus: 'completed'
      },
      { new: true, runValidators: true }
    );

    // Send confirmation email
    const sendEmail = require('../email');
    sendEmail(
      updatedCandidate.email,
      'Form Submitted Successfully - Bliss Connect ✅',
      `Hello ${updatedCandidate.fullName},\n\nYour candidate form has been submitted successfully! ✅\n\nYour profile is now active and visible to employers.\n\nWe will match you with suitable job opportunities soon.\n\nBest regards,\nBliss Connect Team`
    );

    return res.status(200).json({
      success: true,
      message: 'Candidate form submitted successfully',
      data: updatedCandidate
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to submit candidate form');
  }
});

module.exports = router;
