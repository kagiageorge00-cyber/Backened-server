const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const User = require("../models/User");
const Candidate = require("../models/candidate");

function normalizeEnumValue(value, map) {
  if (!value || typeof value !== 'string') return value;
  return map[value.trim().toLowerCase()] || value.trim();
}

const maritalStatusMap = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  separated: 'Separated',
};

const educationalLevelMap = {
  primary: 'Primary',
  secondary: 'Secondary',
  vocational: 'Vocational/Technical',
  'vocational/technical': 'Vocational/Technical',
  technical: 'Vocational/Technical',
  diploma: 'Diploma',
  bachelor: "Bachelor's Degree",
  bachelors: "Bachelor's Degree",
  "bachelor's degree": "Bachelor's Degree",
  'bachelors degree': "Bachelor's Degree",
  master: "Master's Degree",
  masters: "Master's Degree",
  "master's degree": "Master's Degree",
  'masters degree': "Master's Degree",
  phd: 'PhD',
  doctorate: 'PhD',
  other: 'Other',
};

function normalizeMaritalStatus(value) {
  return normalizeEnumValue(value, maritalStatusMap);
}

function normalizeEducationalLevel(value) {
  return normalizeEnumValue(value, educationalLevelMap);
}
 
function normalizePaymentStatus(value) {
  if (!value || typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'unpaid':
      return 'Unpaid';
    default:
      return value.trim();
  }
}
// ✅ SINGLE CLEAN EMAIL FUNCTION
const { sendEmail } = require("../email");
const { notifyPaymentSuccess } = require("../services/notificationservice");

function toArrayField(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateProfileCompletion(candidate) {
  const requiredFields = [
    'photoUrl',
    'nationality',
    'religion',
    'education',
    'experience',
    'skills',
    'languages',
    'dateOfBirth',
    'jobPosition',
    'expectedSalary',
    'destinationCountry',
  ];

  const completedFields = requiredFields.filter((field) => {
    const value = candidate[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value != null && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}

function generateCandidateCode() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `CAND-${year}-${seq}`;
}

function isPhoneLike(value) {
  if (!value || typeof value !== 'string') return false;
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isEmailLike(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ==========================
// SUBMIT PAYMENT HANDLER
// ==========================
async function handleSubmitPayment(req, res) {
  try {
    const {
      userId: userIdFromBody,
      user_id,
      candidateId,
      candidate_id,
      email,
      name,
      amount,
      transactionCode,
      transactionId,
      transaction_id,
      paymentMethod,
      phone,
        nationality,
        religion,
        education,
        educationalLevel,
        experience,
        skills,
        languages,
        gender,
        dateOfBirth,
        maritalStatus,
        numberOfChildren,
        jobPosition,
        jobType,
        destinationCountry,
        destinationPreference,
        expectedSalary,
        photoUrl,
        videoUrl,
        passportUrl,
        medicalUrl,
        resumeUrl,
        additionalUrl,
    } = req.body;

    const userId = userIdFromBody || user_id || phone || candidateId || candidate_id || email;
    const transactionKey = transactionCode || transactionId || transaction_id;
    const parsedAmount = typeof amount === 'string' ? amount.trim() : amount;

    const detectedPhone = phone || (userId && isPhoneLike(userId) ? userId : null);
    const detectedEmail = email || (userId && isEmailLike(userId) ? userId : null);

    if (!userId || parsedAmount == null || !transactionKey) {
      return res.status(400).json({
        success: false,
        error: "userId, amount, transactionCode/transactionId required",
      });
    }

    const finalAmount = Number(parsedAmount);
    if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    // ==========================
    // CHECK DUPLICATE PAYMENT
    // ==========================
    const exists = await Payment.findOne({
      transactionId: transactionKey,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: "Transaction already exists",
      });
    }

    // ==========================
    // SAVE PAYMENT
    // ==========================
    const payment = await Payment.create({
      intentId: "intent_" + Date.now(),
      userId,
      amount: finalAmount,
      title: "Application Payment",
      method: paymentMethod || "mpesa",
      status: "pending",
      transactionId: transactionKey,
      metadata: { name, email },
    });

    console.log("✅ Payment saved:", payment._id);

    // ==========================
    // CREATE OR UPDATE CANDIDATE RECORD
    // ==========================
    try {
      const lookupCriteria = [];
      if (userId) lookupCriteria.push({ phone: userId });
      if (email) lookupCriteria.push({ email });
      lookupCriteria.push({ uniqueCode: userId });

      let candidate = await Candidate.findOne({ $or: lookupCriteria });
      if (!candidate) {
        candidate = await Candidate.create({
          fullName: name || null,
          name: name || null,
            nationality,
            religion,
            education,
            educationalLevel: normalizeEducationalLevel(educationalLevel),
            experience,
            skills: Array.isArray(skills) ? skills : toArrayField(skills),
            languages: Array.isArray(languages) ? languages : toArrayField(languages),
            gender,
            dateOfBirth,
            maritalStatus: normalizeMaritalStatus(maritalStatus),
            numberOfChildren,
            jobPosition,
            jobType,
            destinationCountry,
            destinationPreference: Array.isArray(destinationPreference)
              ? destinationPreference
              : toArrayField(destinationPreference),
            expectedSalary,
          email: detectedEmail,
          phone: detectedPhone,
          uniqueCode: generateCandidateCode(),
          status: 'in_process',
          paymentStatus: normalizePaymentStatus('pending'),
          isVerified: false,
            photoUrl,
            videoUrl,
            passportUrl,
            medicalUrl,
            resumeUrl,
            additionalUrl,
          documents: {
            passportPhoto: null,
            nationalId: null,
            cv: null,
            certificates: [],
            coverLetter: null,
            uploads: [],
          },
          paymentId: payment._id,
        });
          candidate.profileCompletion = calculateProfileCompletion(candidate);
          await candidate.save();
      } else {
        if (!name) {
          if (candidate.fullName && isPhoneLike(candidate.fullName)) candidate.fullName = null;
          if (candidate.name && isPhoneLike(candidate.name)) candidate.name = null;
        }
        candidate.fullName = candidate.fullName || name || null;
        candidate.name = candidate.name || name || null;
          candidate.nationality = nationality || candidate.nationality;
          candidate.religion = religion || candidate.religion;
          candidate.education = education || candidate.education;
          candidate.educationalLevel = normalizeEducationalLevel(educationalLevel) || normalizeEducationalLevel(candidate.educationalLevel);
          candidate.experience = experience || candidate.experience;
          candidate.skills = Array.isArray(skills)
            ? skills
            : skills
              ? toArrayField(skills)
              : candidate.skills;
          candidate.languages = Array.isArray(languages)
            ? languages
            : languages
              ? toArrayField(languages)
              : candidate.languages;
          candidate.gender = gender || candidate.gender;
          candidate.dateOfBirth = dateOfBirth || candidate.dateOfBirth;
          candidate.maritalStatus = normalizeMaritalStatus(maritalStatus) || normalizeMaritalStatus(candidate.maritalStatus);
          candidate.numberOfChildren = numberOfChildren !== undefined ? numberOfChildren : candidate.numberOfChildren;
          candidate.jobPosition = jobPosition || candidate.jobPosition;
          candidate.jobType = jobType || candidate.jobType;
          candidate.destinationCountry = destinationCountry || candidate.destinationCountry;
          candidate.destinationPreference = Array.isArray(destinationPreference)
            ? destinationPreference
            : destinationPreference
              ? toArrayField(destinationPreference)
              : candidate.destinationPreference;
          candidate.expectedSalary = expectedSalary || candidate.expectedSalary;
          candidate.photoUrl = photoUrl || candidate.photoUrl;
          candidate.videoUrl = videoUrl || candidate.videoUrl;
          candidate.passportUrl = passportUrl || candidate.passportUrl;
          candidate.medicalUrl = medicalUrl || candidate.medicalUrl;
          candidate.resumeUrl = resumeUrl || candidate.resumeUrl;
          candidate.additionalUrl = additionalUrl || candidate.additionalUrl;
        candidate.email = candidate.email || detectedEmail;
        candidate.phone = candidate.phone || detectedPhone;
        candidate.uniqueCode = candidate.uniqueCode || generateCandidateCode();
        candidate.status = ['available', 'deployed'].includes(candidate.status)
          ? candidate.status
          : 'in_process';
        candidate.paymentStatus = normalizePaymentStatus('pending');
        candidate.isVerified = candidate.isVerified || false;
        candidate.paymentId = payment._id;
          candidate.profileCompletion = calculateProfileCompletion(candidate);
        await candidate.save();
      }
    } catch (candidateError) {
      console.warn('Could not create or update candidate during payment submission:', candidateError);
    }

    // ==========================
    // RESPOND FAST (IMPORTANT)
    // ==========================
    res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId: payment._id,
      data: payment,
    });

    // ==========================
    // BACKGROUND EMAIL (SAFE)
    // ==========================
    setImmediate(async () => {
      try {
        let notifyEmail = email;
        let notifyName = name;

        // 🔍 fallback lookup if missing email
        if (!notifyEmail) {
          const user =
            (await User.findOne({
              $or: [
                { phone: userId },
                { email: userId },
                { uniqueCode: userId },
              ],
            })) ||
            (await Candidate.findOne({
              $or: [
                { phone: userId },
                { email: userId },
                { uniqueCode: userId },
              ],
            }));

          if (user) {
            notifyEmail = user.email;
            notifyName = user.name || user.fullName;
          }
        }

        if (!notifyEmail) {
          console.warn("⚠️ No email found for payment notification");
          return;
        }

        console.log("📧 Sending payment email to:", notifyEmail);

        try {
          await notifyPaymentSuccess({ email: notifyEmail, name: notifyName });
        } catch (notifyErr) {
          console.warn('notifyPaymentSuccess failed:', notifyErr && notifyErr.message);
        }

        const emailSent = await sendEmail(
          notifyEmail,
          "Payment Received – Bliss Connect",
          `Hello ${notifyName || "Candidate"}, your payment has been received and is pending verification.`,
          `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px;">
              <div>
                <img src="https://blissconnect12.netlify.app/assets/images/logo.png" alt="Bliss Connect" style="max-height: 48px;" />
              </div>
              <div style="text-align: right; color: #777; font-size: 14px;">
                <p style="margin: 0;">Payment Confirmation</p>
              </div>
            </div>
            <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a202c;">Payment Received</h1>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hello ${notifyName || "Candidate"},</p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Thank you for your payment to Bliss Connect. We have successfully received your transaction and it is currently under review.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding: 8px 0; color: #555; width: 160px;">Status:</td>
                <td style="padding: 8px 0; color: #111;"><strong>Pending verification</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;">Amount:</td>
                <td style="padding: 8px 0; color: #111;"><strong>${payment.amount}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;">Transaction ID:</td>
                <td style="padding: 8px 0; color: #111;"><strong>${payment.transactionId}</strong></td>
              </tr>
            </table>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">A member of our team will verify the payment shortly. Once approved, you will receive a follow-up email with the next steps.</p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0;">If you have any questions, please reply to this message or contact our support team.</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
              <p style="margin: 0;">Bliss Connect</p>
              <p style="margin: 4px 0 0;">Professional placement support for overseas candidates.</p>
              <p style="margin: 4px 0 0;">Need help? Email <a href="mailto:blssspprtteam@gmail.com" style="color: #0056d6; text-decoration: none;">blssspprtteam@gmail.com</a></p>
            </div>
          </div>
          `
        );
        console.log("📧 Payment notification result:", { email: notifyEmail, sent: emailSent });
      } catch (err) {
        console.error("Background email error:", err);
      }
    });

  } catch (err) {
    console.error("❌ Payment error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

// ==========================
// ROUTES
// ==========================
router.post("/payments", handleSubmitPayment);
router.post("/submitPayment", handleSubmitPayment);

module.exports = router;