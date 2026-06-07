const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const EmployerNotification = require('../models/EmployerNotification');
const {
  notifyEmployerWelcome,
} = require('../services/notificationservice');

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

router.post('/register', async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      country,
      industry,
      companyAddress,
      website,
      password,
      candidateId,
    } = req.body;

    const normalized = {
      companyName: sanitizeValue(companyName),
      contactPerson: sanitizeValue(contactPerson),
      email: sanitizeValue(email),
      phone: sanitizeValue(phone),
      country: sanitizeValue(country),
      industry: sanitizeValue(industry),
      companyAddress: sanitizeValue(companyAddress),
      website: sanitizeValue(website),
      password: sanitizeValue(password),
    };

    const requiredFields = [
      { key: 'companyName', value: normalized.companyName },
      { key: 'contactPerson', value: normalized.contactPerson },
      { key: 'email', value: normalized.email },
      { key: 'phone', value: normalized.phone },
      { key: 'country', value: normalized.country },
      { key: 'industry', value: normalized.industry },
    ];

    const missingField = requiredFields.find(
      (field) => !field.value || field.value.length === 0
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        error: `${missingField.key} is required`,
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

    const employer = await Employer.create({
      employerId,
      companyName: normalized.companyName,
      contactPerson: normalized.contactPerson,
      email: normalized.email.toLowerCase(),
      phone: normalized.phone,
      country: normalized.country,
      industry: normalized.industry,
      companyAddress: normalized.companyAddress,
      website: normalized.website,
      password: hashedPassword,
      verificationStatus: 'pending',
    });

    await EmployerNotification.create({
      employerId,
      type: 'welcome',
      category: 'welcome',
      title: 'Welcome To Bliss Recruitment',
      message: `Your employer account has been created successfully.\n\nEmployer ID: ${employerId}\n\nYou can now browse verified candidates and schedule interviews.`,
      data: { employerId },
    });

    await notifyEmployerWelcome({
      email: employer.email,
      companyName: employer.companyName,
      employerId,
      contactPerson: employer.contactPerson,
    });

    const { token, expiry } = createEmployerToken(employer);

    return res.status(201).json({
      success: true,
      message: 'Employer registration completed successfully',
      token,
      expiry,
      employer: {
        employerId,
        companyName: employer.companyName,
        contactPerson: employer.contactPerson,
        verificationStatus: employer.verificationStatus,
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
    const { employerId, password, candidateId } = req.body;
    if (!employerId || !password) {
      return res.status(400).json({
        success: false,
        error: 'employerId and password are required',
      });
    }

    const employer = await Employer.findOne({ employerId: sanitizeValue(employerId) });
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
