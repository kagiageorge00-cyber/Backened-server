const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const EmployerNotification = require('../models/EmployerNotification');
const { sendEmail } = require('../email');
const {
  notifyEmployerWelcome,
  sendNotification,
} = require(path.join(__dirname, '..', 'services', 'notificationservice'));
const { sendWhatsAppMessage } = require('../whatsapp');

const JWT_SECRET = process.env.JWT_SECRET || 'employer_secret_key';
const router = express.Router();

function sanitizeValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < length; i += 1) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function generateVerificationToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateEmployerId() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^EMP-${year}-\\d{4}$`);
  const latest = await Employer.findOne({
    employerId: { $regex: regex },
  }).sort({ createdAt: -1 });

  let nextNumber = 1;
  if (latest && latest.employerId) {
    const match = latest.employerId.match(/EMP-\d{4}-(\d{4})$/);
    if (match && match[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `EMP-${year}-${String(nextNumber).padStart(4, '0')}`;
}

function createEmployerToken(employer) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const token = jwt.sign(
    {
      employerId: employer.employerId,
      email: employer.email,
      companyName: employer.companyName,
      role: 'employer',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    expiry: expiresAt.toISOString(),
  };
}

function getFrontendUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    process.env.WEB_APP_URL ||
    'https://app.blissconnect.com'
  );
}

function getVerificationStatus(employer) {
  if (employer.emailVerified && employer.phoneVerified && Array.isArray(employer.documents) && employer.documents.length > 0) {
    return 'documents_submitted';
  }
  if (employer.emailVerified && employer.phoneVerified) {
    return 'phone_verified';
  }
  if (employer.emailVerified) {
    return 'email_verified';
  }
  return 'new_registration';
}

async function sendVerificationEmail(email, name, employerId, token) {
  if (!email) return null;

  const frontendUrl = getFrontendUrl();
  const verificationLink = `${frontendUrl}/employer/verify-email?employerId=${encodeURIComponent(
    employerId
  )}&token=${encodeURIComponent(token)}`;
  const subject = 'Verify your email for Bliss Connect Employer Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Hi ${name || 'Employer'},</h2>
      <p>Thank you for registering with Bliss Connect Employer Portal.</p>
      <p>Please verify your email by clicking the button below:</p>
      <p><a href="${verificationLink}" style="display: inline-block; padding: 12px 20px; background: #1d72b8; color: #fff; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p>${verificationLink}</p>
      <p>Thank you,<br/>Bliss Connect Team</p>
    </div>
  `;

  return sendEmail(email, subject, `Verify your email: ${verificationLink}`, html);
}

async function sendPhoneOtp(phone, code) {
  if (!phone || !code) return null;
  const message = `Your Bliss Connect verification code is ${code}. Use this code to verify your phone number.`;
  try {
    await sendWhatsAppMessage(phone, message);
    return { success: true, provider: 'whatsapp' };
  } catch (err) {
    console.warn('sendPhoneOtp: WhatsApp send failed:', err.message || err);
    return { success: false, error: err.message || 'WhatsApp send failed' };
  }
}

async function sendWhatsAppVerification(employer) {
  if (!employer || !employer.whatsappNumber) return null;
  const code = generateOtpCode();
  const expires = new Date(Date.now() + 1000 * 60 * 15);
  employer.whatsappVerificationCode = code;
  employer.whatsappVerificationExpires = expires;
  await employer.save();

  const message = `Your Bliss Connect WhatsApp verification code is ${code}. It expires in 15 minutes.`;
  return sendWhatsAppMessage(employer.whatsappNumber, message);
}

router.post('/register', async (req, res) => {
  try {
    const {
      employerType,
      fullName,
      profilePhotoUrl,
      dob,
      nationality,
      email,
      phone,
      whatsappNumber,
      country,
      city,
      physicalAddress,
      companyName,
      companyRegistrationNumber,
      industry,
      companyAddress,
      website,
      contactPerson,
      contactPersonPosition,
      numberOfWorkers,
      jobCategories,
      jobDescriptions,
      residenceType,
      numberOfAdults,
      numberOfChildren,
      agesOfChildren,
      elderlyCare,
      pets,
      expectedDuties,
      workingHours,
      daysOff,
      accommodationProvided,
      preferredCandidateLanguage,
      preferredCandidateNationality,
      termsAccepted,
      password,
      candidateId,
    } = req.body;

    const normalized = {
      employerType: sanitizeValue(employerType) || 'company',
      fullName: sanitizeValue(fullName),
      profilePhotoUrl: sanitizeValue(profilePhotoUrl),
      dob: sanitizeValue(dob),
      nationality: sanitizeValue(nationality),
      email: sanitizeValue(email),
      phone: sanitizeValue(phone),
      whatsappNumber: sanitizeValue(whatsappNumber),
      country: sanitizeValue(country),
      city: sanitizeValue(city),
      physicalAddress: sanitizeValue(physicalAddress),
      companyName: sanitizeValue(companyName),
      companyRegistrationNumber: sanitizeValue(companyRegistrationNumber),
      industry: sanitizeValue(industry),
      companyAddress: sanitizeValue(companyAddress),
      website: sanitizeValue(website),
      contactPerson: sanitizeValue(contactPerson),
      contactPersonPosition: sanitizeValue(contactPersonPosition),
      numberOfWorkers: Number(numberOfWorkers) || 0,
      jobCategories: Array.isArray(jobCategories)
        ? jobCategories.map((item) => sanitizeValue(item)).filter(Boolean)
        : typeof jobCategories === 'string'
        ? jobCategories.split(',').map((item) => sanitizeValue(item)).filter(Boolean)
        : [],
      jobDescriptions: sanitizeValue(jobDescriptions),
      residenceType: sanitizeValue(residenceType),
      numberOfAdults: Number(numberOfAdults) || 0,
      numberOfChildren: Number(numberOfChildren) || 0,
      agesOfChildren: Array.isArray(agesOfChildren)
        ? agesOfChildren.map((item) => sanitizeValue(item)).filter(Boolean)
        : typeof agesOfChildren === 'string'
        ? agesOfChildren.split(',').map((item) => sanitizeValue(item)).filter(Boolean)
        : [],
      elderlyCare: elderlyCare === 'true' || elderlyCare === true,
      pets: pets === 'true' || pets === true,
      expectedDuties: sanitizeValue(expectedDuties),
      workingHours: sanitizeValue(workingHours),
      daysOff: sanitizeValue(daysOff),
      accommodationProvided:
        accommodationProvided === 'true' || accommodationProvided === true,
      preferredCandidateLanguage: sanitizeValue(preferredCandidateLanguage),
      preferredCandidateNationality: sanitizeValue(preferredCandidateNationality),
      termsAccepted: termsAccepted === 'true' || termsAccepted === true,
      password: sanitizeValue(password),
    };

    const requiredFields = [
      { key: 'email', value: normalized.email },
      { key: 'phone', value: normalized.phone },
      { key: 'country', value: normalized.country },
      { key: 'termsAccepted', value: normalized.termsAccepted },
    ];

    if (normalized.employerType === 'company') {
      requiredFields.push({ key: 'companyName', value: normalized.companyName });
      requiredFields.push({ key: 'contactPerson', value: normalized.contactPerson });
      requiredFields.push({ key: 'industry', value: normalized.industry });
    } else {
      requiredFields.push({ key: 'fullName', value: normalized.fullName });
      requiredFields.push({ key: 'nationality', value: normalized.nationality });
    }

    const missingField = requiredFields.find(
      (field) => !field.value || field.value.toString().length === 0
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        error: `${missingField.key} is required`,
      });
      });
    }

    const existingEmail = await Employer.findOne({ email: normalized.email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email is already registered',
      });
    }

    const existingPhone = await Employer.findOne({ phone: normalized.phone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        error: 'Phone number is already registered',
      });
    }

    let passwordPlain = normalized.password;
    if (!passwordPlain) {
      passwordPlain = generateTemporaryPassword();
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const employerId = await generateEmployerId();
    const emailVerificationToken = generateVerificationToken();
    const phoneVerificationCode = generateOtpCode();
    const phoneVerificationExpires = new Date(Date.now() + 1000 * 60 * 15);
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const employer = await Employer.create({
      employerId,
      employerType: normalized.employerType,
      fullName: normalized.fullName,
      profilePhotoUrl: normalized.profilePhotoUrl,
      dob: normalized.dob ? new Date(normalized.dob) : undefined,
      nationality: normalized.nationality,
      email: normalized.email.toLowerCase(),
      phone: normalized.phone,
      whatsappNumber: normalized.whatsappNumber,
      country: normalized.country,
      city: normalized.city,
      physicalAddress: normalized.physicalAddress,
      companyName: normalized.companyName,
      companyRegistrationNumber: normalized.companyRegistrationNumber,
      industry: normalized.industry,
      companyAddress: normalized.companyAddress,
      website: normalized.website,
      contactPerson: normalized.contactPerson,
      contactPersonPosition: normalized.contactPersonPosition,
      numberOfWorkers: normalized.numberOfWorkers,
      jobCategories: normalized.jobCategories,
      jobDescriptions: normalized.jobDescriptions,
      residenceType: normalized.residenceType,
      numberOfAdults: normalized.numberOfAdults,
      numberOfChildren: normalized.numberOfChildren,
      agesOfChildren: normalized.agesOfChildren,
      elderlyCare: normalized.elderlyCare,
      pets: normalized.pets,
      expectedDuties: normalized.expectedDuties,
      workingHours: normalized.workingHours,
      daysOff: normalized.daysOff,
      accommodationProvided: normalized.accommodationProvided,
      preferredCandidateLanguage: normalized.preferredCandidateLanguage,
      preferredCandidateNationality: normalized.preferredCandidateNationality,
      termsAccepted: normalized.termsAccepted,
      emailVerificationToken,
      emailVerificationExpires,
      phoneVerificationCode,
      phoneVerificationExpires,
      whatsappVerificationCode: null,
      whatsappVerificationExpires: null,
      verificationStatus: 'new_registration',
      status: 'pending',
      password: hashedPassword,
      profileCompletion: 0,
    });

    await EmployerNotification.create({
      employerId,
      type: 'welcome',
      category: 'welcome',
      title: 'Welcome to Bliss Connect Employer Portal',
      message: `Your employer registration has been submitted successfully. Employer ID: ${employerId}. Please verify your email and phone to continue.`,
      data: { employerId },
    });

    await notifyEmployerWelcome({
      email: employer.email,
      companyName: employer.companyName || employer.fullName,
      employerId,
      contactPerson: employer.contactPerson || employer.fullName,
    });

    try {
      await sendVerificationEmail(employer.email, employer.fullName || employer.companyName, employerId, emailVerificationToken);
    } catch (emailErr) {
      console.warn('Email verification send failed:', emailErr.message || emailErr);
    }

    try {
      await sendPhoneOtp(employer.phone, phoneVerificationCode);
    } catch (phoneErr) {
      console.warn('Phone verification send failed:', phoneErr.message || phoneErr);
    }

    try {
      if (employer.whatsappNumber) {
        await sendWhatsAppVerification(employer);
      }
    } catch (waErr) {
      console.warn('WhatsApp verification send failed:', waErr.message || waErr);
    }

    const { token, expiry } = createEmployerToken(employer);

    return res.status(201).json({
      success: true,
      message: 'Employer registration submitted successfully. Verify your email and phone to continue.',
      token,
      expiry,
      employer: {
        employerId,
        companyName: employer.companyName,
        fullName: employer.fullName,
        employerType: employer.employerType,
        contactPerson: employer.contactPerson,
        status: employer.status,
        verificationStatus: employer.verificationStatus,
        emailVerified: employer.emailVerified,
        phoneVerified: employer.phoneVerified,
        whatsappVerified: employer.whatsappVerified,
      },
      credentials: {
        employerId,
        password: passwordPlain,
      },
      candidateContext: candidateId ? { candidateId } : undefined,
    });
  } catch (error) {
    console.error('Employer registration error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { employerId, email, password, candidateId } = req.body;
    if ((!employerId && !email) || !password) {
      return res.status(400).json({
        success: false,
        error: 'employerId or email and password are required',
      });
    }

    const normalizedLogin = sanitizeValue(employerId || email || '');
    const employer = await Employer.findOne({
      $or: [
        { employerId: normalizedLogin },
        { email: normalizedLogin.toLowerCase() },
      ],
    });

    if (!employer) {
      return res.status(401).json({ success: false, error: 'Invalid Employer ID or password' });
    }

    const match = await bcrypt.compare(password, employer.password || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid Employer ID or password' });
    }

    await EmployerNotification.create({
      employerId: employer.employerId,
      type: 'login',
      category: 'message',
      title: 'Welcome Back',
      message: `Welcome Back ${employer.companyName}!\n\nYou have:\n- 0 candidate notifications\n- 0 interview requests\n- 1 new message`,
      data: {
        candidateNotifications: 0,
        interviewRequests: 0,
        messages: 1,
      },
    });

    const candidateContext = candidateId ? { candidateId } : undefined;

    const candidateNotifications = await EmployerNotification.countDocuments({
      employerId: employer.employerId,
      category: 'candidate',
      status: 'unread',
    });
    const interviewRequests = await EmployerNotification.countDocuments({
      employerId: employer.employerId,
      category: 'interview',
      status: 'unread',
    });
    const messages = await EmployerNotification.countDocuments({
      employerId: employer.employerId,
      category: 'message',
      status: 'unread',
    });

    const { token, expiry } = createEmployerToken(employer);

    return res.json({
      success: true,
      message: 'Employer login successful',
      token,
      expiry,
      employer: {
        employerId: employer.employerId,
        companyName: employer.companyName,
        contactPerson: employer.contactPerson,
        email: employer.email,
        phone: employer.phone,
        country: employer.country,
        industry: employer.industry,
        companyAddress: employer.companyAddress,
        website: employer.website,
        verificationStatus: employer.verificationStatus,
      },
      counts: {
        candidateNotifications,
        interviewRequests,
        messages,
      },
      candidateContext,
    });
  } catch (error) {
    console.error('Employer login error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { employerId, email, token } = req.body;
    if ((!employerId && !email) || !token) {
      return res.status(400).json({ success: false, error: 'employerId or email and token are required' });
    }

    const filter = {
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    };
    if (employerId) filter.employerId = sanitizeValue(employerId);
    if (email) filter.email = sanitizeValue(email).toLowerCase();

    const employer = await Employer.findOne(filter);
    if (!employer) {
      return res.status(400).json({ success: false, error: 'Invalid or expired email verification token' });
    }

    employer.emailVerified = true;
    employer.emailVerificationToken = undefined;
    employer.emailVerificationExpires = undefined;
    employer.verificationStatus = getVerificationStatus(employer);
    await employer.save();

    return res.json({
      success: true,
      message: 'Email verified successfully',
      verificationStatus: employer.verificationStatus,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/verify-phone', async (req, res) => {
  try {
    const { employerId, phone, code } = req.body;
    if ((!employerId && !phone) || !code) {
      return res.status(400).json({ success: false, error: 'employerId or phone and code are required' });
    }

    const filter = {
      phoneVerificationCode: code,
      phoneVerificationExpires: { $gt: new Date() },
    };
    if (employerId) filter.employerId = sanitizeValue(employerId);
    if (phone) filter.phone = sanitizeValue(phone);

    const employer = await Employer.findOne(filter);
    if (!employer) {
      return res.status(400).json({ success: false, error: 'Invalid or expired phone verification code' });
    }

    employer.phoneVerified = true;
    employer.phoneVerificationCode = undefined;
    employer.phoneVerificationExpires = undefined;
    employer.verificationStatus = getVerificationStatus(employer);
    await employer.save();

    return res.json({
      success: true,
      message: 'Phone verified successfully',
      verificationStatus: employer.verificationStatus,
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/whatsapp/send-code', async (req, res) => {
  try {
    const { employerId } = req.body;
    if (!employerId) {
      return res.status(400).json({ success: false, error: 'employerId is required' });
    }

    const employer = await Employer.findOne({ employerId: sanitizeValue(employerId) });
    if (!employer || !employer.whatsappNumber) {
      return res.status(404).json({ success: false, error: 'Employer or WhatsApp number not found' });
    }

    await sendWhatsAppVerification(employer);

    return res.json({
      success: true,
      message: 'WhatsApp verification code sent',
    });
  } catch (error) {
    console.error('WhatsApp send code error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/whatsapp/verify', async (req, res) => {
  try {
    const { employerId, code } = req.body;
    if (!employerId || !code) {
      return res.status(400).json({ success: false, error: 'employerId and code are required' });
    }

    const employer = await Employer.findOne({
      employerId: sanitizeValue(employerId),
      whatsappVerificationCode: code,
      whatsappVerificationExpires: { $gt: new Date() },
    });

    if (!employer) {
      return res.status(400).json({ success: false, error: 'Invalid or expired WhatsApp verification code' });
    }

    employer.whatsappVerified = true;
    employer.whatsappVerificationCode = undefined;
    employer.whatsappVerificationExpires = undefined;
    employer.verificationStatus = getVerificationStatus(employer);
    await employer.save();

    return res.json({
      success: true,
      message: 'WhatsApp verified successfully',
      verificationStatus: employer.verificationStatus,
    });
  } catch (error) {
    console.error('WhatsApp verification error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:employerId/profile', async (req, res) => {
  try {
    const { employerId } = req.params;
    if (!employerId) {
      return res.status(400).json({ success: false, error: 'employerId parameter is required' });
    }

    const employer = await Employer.findOne({ employerId: sanitizeValue(employerId) });
    if (!employer) {
      return res.status(404).json({ success: false, error: 'Employer not found' });
    }

    return res.json({
      success: true,
      data: {
        employerId: employer.employerId,
        companyName: employer.companyName,
        contactPerson: employer.contactPerson,
        email: employer.email,
        phone: employer.phone,
        country: employer.country,
        industry: employer.industry,
        companyAddress: employer.companyAddress,
        website: employer.website,
        verificationStatus: employer.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Employer profile error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ======================
// UPDATE EMPLOYER PROFILE
// Allows employer to complete or update their company details
// ======================
router.put('/:employerId', async (req, res) => {
  try {
    const { employerId } = req.params;
    if (!employerId) {
      return res.status(400).json({ success: false, error: 'employerId parameter is required' });
    }

    const allowed = [
      'companyName',
      'contactPerson',
      'email',
      'phone',
      'country',
      'industry',
      'companyAddress',
      'website',
    ];

    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const val = req.body[key];
        if (typeof val === 'string') updates[key] = val.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided to update' });
    }

    const updated = await Employer.findOneAndUpdate(
      { employerId: sanitizeValue(employerId) },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Employer not found' });
    }

    return res.json({ success: true, message: 'Employer profile updated', data: {
      employerId: updated.employerId,
      companyName: updated.companyName,
      contactPerson: updated.contactPerson,
      email: updated.email,
      phone: updated.phone,
      country: updated.country,
      industry: updated.industry,
      companyAddress: updated.companyAddress,
      website: updated.website,
      verificationStatus: updated.verificationStatus,
    }});
  } catch (error) {
    console.error('Employer update error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:employerId/stats', async (req, res) => {
  try {
    const { employerId } = req.params;
    if (!employerId) {
      return res.status(400).json({ success: false, error: 'employerId parameter is required' });
    }

    const candidateNotifications = await EmployerNotification.countDocuments({
      employerId: sanitizeValue(employerId),
      category: 'candidate',
      status: 'unread',
    });
    const interviewRequests = await EmployerNotification.countDocuments({
      employerId: sanitizeValue(employerId),
      category: 'interview',
      status: 'unread',
    });
    const messages = await EmployerNotification.countDocuments({
      employerId: sanitizeValue(employerId),
      category: 'message',
      status: 'unread',
    });
    const totalNotifications = await EmployerNotification.countDocuments({
      employerId: sanitizeValue(employerId),
      status: 'unread',
    });

    return res.json({
      success: true,
      data: {
        candidateNotifications,
        interviewRequests,
        messages,
        totalNotifications,
      },
    });
  } catch (error) {
    console.error('Employer stats error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:employerId/notifications', async (req, res) => {
  try {
    const { employerId } = req.params;
    if (!employerId) {
      return res.status(400).json({ success: false, error: 'employerId parameter is required' });
    }

    const notifications = await EmployerNotification.find({ employerId: sanitizeValue(employerId) }).sort({ createdAt: -1 });
    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Employer notifications error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
