const logger = require('../../utils/logger');
const { validateRegisterPayload, validateLoginPayload } = require('../validation/authValidation');
const { buildBlissId, identifyLoginMethod, hashPassword, comparePassword, signAccessToken, signRefreshToken, randomOtp, randomToken } = require('../services/authService');
const AuthRepository = require('../repositories/authRepository');
const UserModel = require('../../models/BlissCommunicationUser');
const CandidateModel = require('../../models/candidate');
const VerificationTokenModel = require('../../models/BlissVerificationToken');
const PhoneOtpModel = require('../../models/BlissPhoneOtp');
const LoginHistoryModel = require('../../models/LoginHistory');

const authRepository = new AuthRepository();

function buildUserPayload(user) {
  return {
    id: user._id?.toString?.() || user.id,
    blissId: user.blissId,
    candidateId: user.candidateId || null,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    country: user.country,
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    status: user.status || 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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
      passwordHash,
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
      user = await authRepository.findUserByIdentifier(identifier, UserModel);
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
          passwordHash: await hashPassword(password),
          emailVerified: Boolean(candidate.isVerified),
          phoneVerified: Boolean(candidate.isVerified),
          status: 'active',
        });
        user = newUser;
      } else {
        user = linkedUser;
      }
    } else {
      const passwordMatch = await comparePassword(password, user.passwordHash || '');
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

    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const otp = await randomOtp();
    await authRepository.createOtp(PhoneOtpModel, {
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      verified: false,
    });

    return res.json({ success: true, message: 'OTP sent successfully.', otp });
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

    const record = await PhoneOtpModel.findOne({ otp, verified: false }).sort({ createdAt: -1 });
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

    user.phoneVerified = true;
    await user.save();
    record.verified = true;
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
