const logger = require('../../utils/logger');
const { validateRegisterPayload, validateLoginPayload } = require('../validation/authValidation');
const { buildBlissId, identifyLoginMethod, hashPassword, comparePassword, compareAndUpgradeLegacyPassword, signAccessToken, signRefreshToken, randomOtp, randomToken } = require('../services/authService');
const AuthRepository = require('../repositories/authRepository');
const UserModel = require('../../models/BlissCommunicationUser');
const CandidateModel = require('../../models/candidate');
const VerificationTokenModel = require('../../models/BlissVerificationToken');
const PhoneOtpModel = require('../../models/BlissPhoneOtp');
const LoginHistoryModel = require('../../models/LoginHistory');
const WhatsAppOptOutModel = require('../../models/WhatsAppOptOut');
const whatsappCloudService = require('../../services/whatsappCloudService');
const whatsappContactService = require('../../services/whatsappContactService');
const axios = require('axios');
const crypto = require('crypto');

const authRepository = new AuthRepository();

function buildUserPayload(user) {
  const services = Array.isArray(user.services) ? user.services : [];
  const profileComplete = Boolean(
    user.location &&
      user.phone &&
      user.whatsapp &&
      user.termsAccepted,
  );
  return {
    id: user._id?.toString?.() || user.id,
    blissId: user.blissId,
    candidateId: user.candidateId || null,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    whatsapp: user.whatsapp || '',
    location: user.location || '',
    country: user.country,
    services,
    notificationChannels: Array.isArray(user.notificationChannels) &&
      user.notificationChannels.length > 0
      ? user.notificationChannels
      : user.notificationsConsent
        ? CUSTOMER_NOTIFICATION_CHANNELS
        : [],
    profileComplete,
    termsAccepted: Boolean(user.termsAccepted),
    notificationsConsent: Boolean(user.notificationsConsent),
    marketingConsent: Boolean(user.marketingConsent),
    authProvider: user.authProvider || 'password',
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    whatsappVerified: Boolean(user.whatsappVerified),
    status: user.status || 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const CUSTOMER_TERMS_VERSION = '2026-10-25';
const CUSTOMER_SERVICES = new Set([
  'Overseas job recruitment and applications',
  'Visa processing and ticketing',
  'Passport and other travel documents',
  'Birth certificate applications',
  'Medical examinations and GAMCA bookings',
  'Invitation letters and work permits',
  'Flights, hotels and holiday packages',
  'Candidate and employer marketplace',
  'Office appointments and customer support',
]);
const CUSTOMER_NOTIFICATION_CHANNELS = Object.freeze([
  'whatsapp',
  'email',
  'in_app',
  'fcm',
]);

function normalizeWhatsAppNumber(value) {
  const phone = String(value || '').trim().replace(/[\s().-]/g, '');
  if (phone.startsWith('00')) return phone.substring(2);
  return phone.replace(/^\+/, '');
}

async function subscribeCustomerToWhatsApp(user) {
  if (!user.notificationsConsent || !user.marketingConsent || !user.whatsapp) {
    return null;
  }
  try {
    const { contact } = await whatsappContactService.createOrUpdateContact({
      fullName: user.fullName,
      phoneNumber: user.whatsapp,
      source: 'bliss_connect_registration',
      tags: ['bliss-connect-customer'],
      optedIn: true,
      marketingOptIn: true,
      serviceNotificationOptIn: true,
    });
    await WhatsAppOptOutModel.deleteOne({ phoneNumber: contact.phoneNumber });
    return true;
  } catch (error) {
    logger.error('Customer WhatsApp campaign opt-in could not be saved', {
      blissId: user.blissId,
      error: error.message,
    });
    return false;
  }
}

async function sendCustomerWhatsAppOtp(user, { phoneNumber } = {}) {
  const recipient = normalizeWhatsAppNumber(
    phoneNumber || user.whatsapp || user.phone,
  );
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (!recipient || !templateName) {
    return {
      sent: false,
      error: !recipient
        ? 'No valid WhatsApp number is available.'
        : 'WhatsApp OTP template is not configured.',
    };
  }

  let record;
  try {
    const otp = await randomOtp();
    record = await authRepository.createOtp(PhoneOtpModel, {
      userId: user._id,
      phone: recipient,
      otp,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      verifiedAt: null,
    });
    const result = await whatsappCloudService.sendTemplateMessage(
      recipient,
      templateName,
      [otp],
      process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en',
    );
    if (!result.success) {
      record.verifiedAt = new Date();
      await record.save();
      logger.error('Customer WhatsApp OTP delivery failed', {
        blissId: user.blissId,
        error: result.error,
      });
      return {
        sent: false,
        error: result.error || 'WhatsApp could not deliver the verification code.',
      };
    }
    return { sent: true };
  } catch (error) {
    if (record) {
      record.verifiedAt = new Date();
      await record.save();
    }
    logger.error('Customer WhatsApp OTP delivery failed', {
      blissId: user.blissId,
      error: error.message,
    });
    return {
      sent: false,
      error: error.message || 'WhatsApp could not deliver the verification code.',
    };
  }
}

function createCustomerBlissId() {
  return buildBlissId(new Date().getFullYear(), crypto.randomInt(1, 1000000));
}

function validateCustomerProfile(body, { requirePassword = false } = {}) {
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const services = Array.isArray(body.services)
    ? [...new Set(body.services.filter((service) => typeof service === 'string').map((service) => service.trim()).filter(Boolean))]
    : [];
  const phonePattern = /^\+?[1-9]\d{7,14}$/;
  const normalizedPhone = phone.replace(/[\s().-]/g, '');
  const normalizedWhatsapp = whatsapp.replace(/[\s().-]/g, '');
  const password = typeof body.password === 'string' ? body.password : '';
  const errors = [];

  if (fullName.length < 2) errors.push('Full name is required.');
  if (location.length < 2) errors.push('Location is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
  if (!phonePattern.test(normalizedPhone)) errors.push('A valid mobile number is required.');
  if (!phonePattern.test(normalizedWhatsapp)) errors.push('A valid WhatsApp number is required.');
  if (services.some((service) => !CUSTOMER_SERVICES.has(service))) {
    errors.push('Choose services from the available Bliss Connect service list.');
  }
  if (body.termsAccepted !== true) errors.push('You must agree to the Terms and Privacy Policy.');
  if (requirePassword) {
    if (password.length < 10) errors.push('Password must be at least 10 characters long.');
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      errors.push('Password must include uppercase, lowercase, numbers, and symbols.');
    }
    if (password !== body.confirmPassword) errors.push('Passwords do not match.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    profile: {
      fullName,
      location,
      phone: normalizedPhone,
      whatsapp: normalizedWhatsapp,
      email,
      services,
      notificationsConsent: body.notificationsConsent === true,
    },
  };
}

function buildCustomerUser(profile, extras = {}) {
  const country = profile.location.split(',').pop().trim() || profile.location;
  const marketingConsent =
    profile.notificationsConsent && extras.marketingConsent === true;
  return {
    ...extras,
    blissId: createCustomerBlissId(),
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    location: profile.location,
    country,
    services: profile.services,
    termsAccepted: true,
    termsVersion: CUSTOMER_TERMS_VERSION,
    termsAcceptedAt: new Date(),
    notificationsConsent: profile.notificationsConsent,
    notificationsConsentAt: profile.notificationsConsent ? new Date() : null,
    notificationChannels: profile.notificationsConsent
      ? CUSTOMER_NOTIFICATION_CHANNELS
      : [],
    marketingConsent,
    marketingConsentAt: marketingConsent ? new Date() : null,
    userType: 'customer',
    emailVerified: false,
    phoneVerified: false,
    status: 'active',
  };
}

function issueCustomerTokens(user) {
  return {
    accessToken: signAccessToken({
      sub: user._id.toString(),
      blissId: user.blissId,
      role: 'customer',
    }),
    refreshToken: signRefreshToken({
      sub: user._id.toString(),
      blissId: user.blissId,
      role: 'customer',
    }),
  };
}

async function registerCustomer(req, res) {
  try {
    const validation = validateCustomerProfile(req.body, { requirePassword: true });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Customer profile validation failed.',
        errors: validation.errors,
      });
    }
    const existing = await UserModel.findOne({
      $or: [{ email: validation.profile.email }, { phone: validation.profile.phone }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account already exists with this email or mobile number.',
      });
    }

    const user = await authRepository.createUser(
      UserModel,
      buildCustomerUser(validation.profile, {
        password: req.body.password,
        authProvider: 'password',
        marketingConsent: req.body.marketingConsent === true,
      }),
    );
    const campaignSubscribed = await subscribeCustomerToWhatsApp(user);
    const otpDelivery = await sendCustomerWhatsAppOtp(user);
    const tokens = issueCustomerTokens(user);
    logger.info('Customer registration success', {
      blissId: user.blissId,
      email: user.email,
    });
    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully.',
      ...tokens,
      user: buildUserPayload(user),
      whatsappCampaignSubscribed: campaignSubscribed,
      whatsappOtpSent: otpDelivery.sent,
      ...(otpDelivery.error ? { whatsappOtpError: otpDelivery.error } : {}),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account already exists with this email or mobile number.',
      });
    }
    logger.error('Customer registration error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Customer account could not be created.',
    });
  }
}

async function googleCustomerSignIn(req, res) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const idToken = typeof req.body.idToken === 'string' ? req.body.idToken : '';
    if (!clientId) {
      return res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured on the server.',
      });
    }
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required.' });
    }
    const verification = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: idToken },
      timeout: 10000,
    });
    const identity = verification.data;
    if (
      identity.aud !== clientId ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(identity.iss) ||
      String(identity.email_verified) !== 'true' ||
      Number(identity.exp) <= Math.floor(Date.now() / 1000) ||
      !identity.email
    ) {
      return res.status(401).json({
        success: false,
        message: 'Google could not verify this account.',
      });
    }

    const email = String(identity.email).trim().toLowerCase();
    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await authRepository.createUser(
        UserModel,
        {
          blissId: createCustomerBlissId(),
          fullName: identity.name || identity.given_name || 'Bliss customer',
          email,
          phone: `pending-${crypto.randomUUID()}`,
          whatsapp: '',
          location: '',
          country: 'Pending profile completion',
          services: [],
          termsAccepted: false,
          notificationsConsent: false,
          marketingConsent: false,
          password: crypto.randomBytes(48).toString('hex'),
          authProvider: 'google',
          userType: 'customer',
          emailVerified: true,
          phoneVerified: false,
          status: 'active',
        },
      );
    }
    if (
      user.status === 'suspended' ||
      user.profileStatus === 'suspended' ||
      user.isActive === false
    ) {
      return res.status(403).json({ success: false, message: 'This account is unavailable.' });
    }
    return res.json({
      success: true,
      message: 'Google sign-in successful.',
      ...issueCustomerTokens(user),
      user: buildUserPayload(user),
    });
  } catch (error) {
    logger.error('Google customer sign-in error', { error: error.message });
    const status = error.response?.status === 400 ? 401 : 502;
    return res.status(status).json({
      success: false,
      message: status === 401
        ? 'Google could not verify this sign-in.'
        : 'Google sign-in could not be completed.',
    });
  }
}

async function completeCustomerProfile(req, res) {
  try {
    const validation = validateCustomerProfile(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Customer profile validation failed.',
        errors: validation.errors,
      });
    }
    const user = await UserModel.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    const duplicatePhone = await UserModel.findOne({
      phone: validation.profile.phone,
      _id: { $ne: user._id },
    });
    if (duplicatePhone) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already associated with another account.',
      });
    }
    Object.assign(user, buildCustomerUser(validation.profile, {
      marketingConsent: req.body.marketingConsent === true,
    }));
    user.termsVersion = CUSTOMER_TERMS_VERSION;
    await user.save();
    const campaignSubscribed = await subscribeCustomerToWhatsApp(user);
    const otpDelivery = await sendCustomerWhatsAppOtp(user);
    return res.json({
      success: true,
      message: 'Customer profile completed.',
      ...issueCustomerTokens(user),
      user: buildUserPayload(user),
      whatsappCampaignSubscribed: campaignSubscribed,
      whatsappOtpSent: otpDelivery.sent,
      ...(otpDelivery.error ? { whatsappOtpError: otpDelivery.error } : {}),
    });
  } catch (error) {
    logger.error('Customer profile completion error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Customer profile could not be completed.',
    });
  }
}

async function updateCustomerServices(req, res) {
  try {
    const submitted = req.body?.services;
    if (
      !Array.isArray(submitted) ||
      submitted.some(
        (service) =>
          typeof service !== 'string' ||
          !CUSTOMER_SERVICES.has(service.trim()),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Choose services from the available Bliss Connect service list.',
      });
    }

    const services = [...new Set(submitted.map((service) => service.trim()))];
    const user = await UserModel.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    user.services = services;
    await user.save();
    return res.json({
      success: true,
      message: 'Service interests updated.',
      user: buildUserPayload(user),
    });
  } catch (error) {
    logger.error('Customer service-interest update error', {
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: 'Service interests could not be updated.',
    });
  }
}

async function register(req, res) {
  try {
    const validation = validateRegisterPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: validation.errors });
    }

    const email = String(req.body.email).trim().toLowerCase();
    const phone = String(req.body.phone).trim();
    const existing = await UserModel.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account already exists with this email or phone.' });
    }

    const passwordHash = await hashPassword(req.body.password);
    const blissId = buildBlissId();

    const user = await authRepository.createUser(UserModel, {
      blissId,
      fullName: req.body.fullName.trim(),
      email,
      phone,
      country: req.body.country.trim(),
      password: passwordHash,
      emailVerified: false,
      phoneVerified: false,
      status: 'active',
    });

    const verificationToken = await randomToken();
    await authRepository.createVerificationToken(VerificationTokenModel, {
      userId: user._id,
      token: verificationToken,
      type: 'email',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      used: false,
    });

    const accessToken = signAccessToken({ sub: user._id.toString(), blissId: user.blissId, role: 'user' });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), blissId: user.blissId, role: 'user' });

    logger.info('Auth register success', { blissId: user.blissId, email });
    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      accessToken,
      refreshToken,
      user: buildUserPayload(user),
      verificationToken,
    });
  } catch (error) {
    logger.error('Auth register error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Registration failed.', error: error.message });
  }
}

async function login(req, res) {
  try {
    const validation = validateLoginPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: validation.errors });
    }

    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    const method = identifyLoginMethod(identifier);

    let user = null;
    if (method === 'candidate_id' || method === 'bliss_id' || method === 'email' || method === 'phone') {
      user = await authRepository.findUserByIdentifier(identifier, UserModel, {
        includeLegacyPasswordHash: true,
      });
    }

    if (!user) {
      const candidate = await authRepository.findCandidateByIdentifier(CandidateModel, identifier);
      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Account not found.' });
      }
      const passwordMatch = await comparePassword(password, candidate.password || '');
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
      }

      const linkedUser = await UserModel.findOne({ candidateId: candidate.uniqueCode || candidate.candidateId || identifier });
      if (!linkedUser) {
        const newUser = await authRepository.createUser(UserModel, {
          blissId: buildBlissId(),
          candidateId: candidate.uniqueCode || candidate.candidateId || identifier,
          fullName: candidate.fullName || candidate.name || 'Candidate',
          email: candidate.email || '',
          phone: candidate.phone || '',
          country: candidate.country || 'Unknown',
          password: await hashPassword(password),
          emailVerified: Boolean(candidate.isVerified),
          phoneVerified: Boolean(candidate.isVerified),
          status: 'active',
        });
        user = newUser;
      } else {
        user = linkedUser;
      }
    } else {
      const passwordMatch = await compareAndUpgradeLegacyPassword(user, password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
      }
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), blissId: user.blissId, role: 'user' });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), blissId: user.blissId, role: 'user' });

    await authRepository.createLoginRecord(LoginHistoryModel, {
      userId: user._id,
      ipAddress: req.ip,
      device: req.get('User-Agent') || 'unknown',
      browser: req.get('User-Agent') || 'unknown',
      loginTime: new Date(),
    });

    logger.info('Auth login success', { blissId: user.blissId, method });
    return res.json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: buildUserPayload(user),
      verificationStatus: {
        emailVerified: Boolean(user.emailVerified),
        phoneVerified: Boolean(user.phoneVerified),
      },
    });
  } catch (error) {
    logger.error('Auth login error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
  }
}

async function profile(req, res) {
  try {
    const user = await UserModel.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: buildUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Profile lookup failed.', error: error.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const record = await VerificationTokenModel.findOne({ token, type: 'email', used: false });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Verification token not found.' });
    }

    const user = await UserModel.findById(record.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.emailVerified = true;
    await user.save();
    record.used = true;
    await record.save();

    return res.json({ success: true, message: 'Email verified successfully.', user: buildUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Email verification failed.', error: error.message });
  }
}

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const normalizedPhone = normalizeWhatsAppNumber(phone);
    const user = await UserModel.findOne({
      $or: [{ phone }, { whatsapp: phone }, { phone: `+${normalizedPhone}` }, { whatsapp: `+${normalizedPhone}` }],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    const delivery = await sendCustomerWhatsAppOtp(user, { phoneNumber: phone });
    if (!delivery.sent) {
      return res.status(502).json({
        success: false,
        message: delivery.error || 'WhatsApp could not deliver the verification code.',
      });
    }
    return res.json({
      success: true,
      message: 'Verification code sent to your WhatsApp.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'OTP sending failed.', error: error.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
    }

    const normalizedPhone = normalizeWhatsAppNumber(phone);
    const record = await PhoneOtpModel.findOne({
      phone: normalizedPhone,
      otp: String(otp),
      verifiedAt: null,
    }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(404).json({ success: false, message: 'OTP not found.' });
    }
    if (record.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'OTP expired.' });
    }

    const user = await UserModel.findById(record.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (normalizeWhatsAppNumber(user.whatsapp) === normalizedPhone) {
      user.whatsappVerified = true;
    } else if (normalizeWhatsAppNumber(user.phone) === normalizedPhone) {
      user.phoneVerified = true;
    } else {
      return res.status(400).json({ success: false, message: 'The WhatsApp number does not match this account.' });
    }
    await user.save();
    record.verifiedAt = new Date();
    await record.save();

    return res.json({ success: true, message: 'Phone verified successfully.', user: buildUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'OTP verification failed.', error: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier is required.' });
    }
    const user = await authRepository.findUserByIdentifier(identifier, UserModel);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    return res.json({ success: true, message: 'Password reset instructions sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Password reset failed.', error: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
    }
    const user = await authRepository.findUserByIdentifier(identifier, UserModel);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    user.passwordHash = await hashPassword(password);
    await user.save();
    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Password reset failed.', error: error.message });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }
    const payload = jwt.verify(refreshToken, process.env.BLISS_JWT_SECRET || 'bliss-auth-secret');
    const accessToken = signAccessToken({ sub: payload.sub, blissId: payload.blissId, role: payload.role || 'user' });
    return res.json({ success: true, accessToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Refresh token expired or invalid.' });
  }
}

async function logout(req, res) {
  try {
    return res.json({ success: true, message: 'Logout successful.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed.', error: error.message });
  }
}

module.exports = {
  register,
  registerCustomer,
  googleCustomerSignIn,
  completeCustomerProfile,
  updateCustomerServices,
  validateCustomerProfile,
  buildUserPayload,
  sendCustomerWhatsAppOtp,
  subscribeCustomerToWhatsApp,
  login,
  profile,
  verifyEmail,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
};
