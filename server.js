const express = require('express');
const app = express();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const { notifyPaymentSuccess, notifyRegistrationSuccess, notifyApplicationUpdate, sendNotification } = require('./notificationService');
// ----------------------
// Bliss Connect: Medical Booking System
// ----------------------
const medicalBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlissUser', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  idNumber: { type: String, required: true },
  gender: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  amount: { type: Number, default: 7500 },
  paymentStatus: { type: String, default: 'pending_verification' },
  bookingStatus: { type: String, default: 'pending' },
  transactionCode: { type: String },
  paymentProofUrl: { type: String },
  date: { type: String },
  time: { type: String },
  venue: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const MedicalBooking = mongoose.models.MedicalBooking || mongoose.model('MedicalBooking', medicalBookingSchema);

// Candidate books medical (step 1)
app.post('/api/medical/book', async (req, res) => {
  try {
    const { userId, fullName, phone, idNumber, gender, dateOfBirth } = req.body;
    if (!userId || !fullName || !phone || !idNumber || !gender || !dateOfBirth) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const booking = new MedicalBooking({
      userId,
      fullName,
      phone,
      idNumber,
      gender,
      dateOfBirth,
      amount: 7500,
      paymentStatus: 'pending_verification',
      bookingStatus: 'pending',
    });
    await booking.save();
    // Notify user
    const user = await BlissUser.findById(userId);
    if (user) {
      await sendNotification(user, 'Your medical booking has been received. Please submit payment proof to continue.');
    }
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Candidate submits payment proof (step 2)
const paymentProofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../assets/payment_proofs'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const paymentProofUpload = multer({ storage: paymentProofStorage, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/medical/payment-proof/:bookingId', paymentProofUpload.single('proof'), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { transactionCode } = req.body;
    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (transactionCode) booking.transactionCode = transactionCode;
    if (req.file) booking.paymentProofUrl = `/assets/payment_proofs/${req.file.filename}`;
    booking.paymentStatus = 'pending_verification';
    await booking.save();
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: view all pending medical payments
app.get('/api/admin/medical/pending', async (req, res) => {
  try {
    const bookings = await MedicalBooking.find({ paymentStatus: 'pending_verification' });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: approve/reject payment and assign slot
app.post('/api/admin/medical/verify', async (req, res) => {
  try {
    const { bookingId, action, date, time, venue } = req.body;
    if (!bookingId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Missing bookingId or invalid action' });
    }
    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (action === 'approve') {
      // Auto-scheduling logic
      // Working days: Mon–Fri, 9am–4pm, max 20 bookings/day
      const VENUE = venue || 'Bliss Medical Center';
      const startHour = 9;
      const endHour = 16;
      const maxPerDay = 20;
      let slotDate = date ? new Date(date) : new Date();
      let slotTime = time;
      let found = false;
      // Helper: get weekday (1=Mon, 5=Fri)
      function isWorkingDay(d) {
        const wd = d.getDay();
        return wd >= 1 && wd <= 5;
      }
      while (!found) {
        // Skip weekends
        if (!isWorkingDay(slotDate)) {
          slotDate.setDate(slotDate.getDate() + 1);
          continue;
        }
        // Count bookings for this day
        const dayStr = slotDate.toISOString().slice(0, 10);
        const count = await MedicalBooking.countDocuments({ date: dayStr, bookingStatus: 'confirmed' });
        if (count < maxPerDay) {
          // Assign next available time slot
          const hour = startHour + (count % (endHour - startHour + 1));
          slotTime = `${hour}:00`;
          booking.date = dayStr;
          booking.time = slotTime;
          booking.venue = VENUE;
          found = true;
        } else {
          // Move to next day
          slotDate.setDate(slotDate.getDate() + 1);
        }
      }
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
      // Notify user of confirmation
      const user = await BlissUser.findById(booking.userId);
      if (user) {
        await sendNotification(user, `Your medical booking is confirmed. Date: ${booking.date}, Time: ${booking.time}, Venue: ${booking.venue}`);
      }
    } else {
      booking.paymentStatus = 'rejected';
      booking.bookingStatus = 'rejected';
      // Notify user of rejection
      const user = await BlissUser.findById(booking.userId);
      if (user) {
        await sendNotification(user, 'Your medical booking payment was rejected. Please contact support.');
      }
    }
    await booking.save();
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Candidate: get their medical booking(s)
app.get('/api/medical/my/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await MedicalBooking.find({ userId });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
// ----------------------
// Bliss Connect: Video Upload & Review
// ----------------------
// Multer storage for mp4 only, max 50MB
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../assets/videos'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, unique + '.mp4');
  },
});
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'video/mp4') {
      return cb(new Error('Only mp4 videos allowed'));
    }
    cb(null, true);
  },
});

// Video upload endpoint (candidates only)
app.post('/api/users/:userId/upload-video', videoUpload.single('video'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await BlissUser.findById(userId);
    if (!user || user.userType !== 'candidate') {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded' });
    }

    // Validate duration (30–120s)
    const videoPath = req.file.path;
    ffmpeg.ffprobe(videoPath, async (err, metadata) => {
      if (err) {
        return res.status(400).json({ success: false, error: 'Could not analyze video' });
      }
      const duration = metadata.format.duration;
      if (duration < 30 || duration > 120) {
        return res.status(400).json({ success: false, error: 'Video duration must be 30–120 seconds' });
      }

      // Save videoUrl and set videoStatus
      user.videoUrl = `/assets/videos/${path.basename(videoPath)}`;
      user.videoStatus = 'pending_review';
      await user.save();

      return res.status(200).json({ success: true, videoUrl: user.videoUrl, videoStatus: user.videoStatus });
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: review candidate videos (approve/reject)
app.post('/api/admin/review-video', async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Missing userId or invalid action' });
    }
    const user = await BlissUser.findById(userId);
    if (!user || user.userType !== 'candidate') {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    user.videoStatus = action === 'approve' ? 'approved' : 'rejected';
    await user.save();
    return res.status(200).json({ success: true, videoStatus: user.videoStatus });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get all candidates with approved videos
app.get('/api/users/candidates-approved', async (req, res) => {
  try {
    const candidates = await BlissUser.find({ userType: 'candidate', videoStatus: 'approved' });
    return res.status(200).json({ success: true, candidates });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


const PORT = process.env.PORT || 3000;

app.use(cors());

// Simple in-memory storage for registered users (optional)
const users = [];

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - body: ${JSON.stringify(req.body || {})}`);
  next();
});

// Root health route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Utility: generate alphanumeric code
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Utility: create realistic mock flights
function mockFlights(origin, destination, date) {
  const carriers = ['Skyway Air', 'Sunset Airlines', 'CloudNine Flights', 'JetWave', 'Aurora Airways'];
  const basePrices = [199, 229, 249, 279, 319];

  return carriers.map((carrier, idx) => ({
    airline: carrier,
    flightNumber: `${carrier.split(' ')[0].substring(0,2).toUpperCase()}${100 + idx}`,
    price: Number((basePrices[idx] + Math.random() * 120).toFixed(2)),
    departure: `${date}T${(6 + idx * 3).toString().padStart(2, '0')}:00:00`,
    arrival: `${date}T${(8 + idx * 3).toString().padStart(2, '0')}:30:00`,
    duration: `${2 + idx}h ${30 - idx * 5}m`,
    origin,
    destination,
  }));
}

// Utility: create mock hotels
function mockHotels(city) {
  const hotels = [
    { name: `${city} Grand Hotel`, price: 180.0, rating: 4.6, location: `${city} Central` },
    { name: `${city} Comfort Suites`, price: 120.0, rating: 4.2, location: `${city} Downtown` },
    { name: `${city} Budget Inn`, price: 75.0, rating: 3.8, location: `${city} Suburbs` },
  ];
  return hotels.map(h => ({ ...h, price: Number((h.price + Math.random() * 40).toFixed(2)) }));
}

// GET helpers to advise using POST
function methodAdvice(req, res) {
  res.status(200).json({ success: false, message: 'Use POST to access this endpoint' });
}


// Bliss Connect Registration

// User Schema for MongoDB (Bliss Connect)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  userType: { type: String, enum: ['candidate', 'employer', 'agent'], required: true },
  email: { type: String },
  profileStatus: { type: String, default: 'incomplete' },
  medicalStatus: { type: String, default: 'not_booked' },
  createdAt: { type: Date, default: Date.now },
});
const BlissUser = mongoose.models.BlissUser || mongoose.model('BlissUser', userSchema);

app.get('/register', methodAdvice);
app.post('/register', async (req, res, next) => {
  try {
    // Accept all fields, but require name, phone, userType
    const { name, phone, userType } = req.body || {};
    if (!name || !phone || !userType) {
      return res.status(400).json({ success: false, error: 'Missing required fields: name, phone, userType' });
    }

    // Check for duplicate phone
    const exists = await BlissUser.findOne({ phone });
    if (exists) {
      return res.status(409).json({ success: false, error: 'Phone already registered' });
    }

    // Build user object with all provided fields, but enforce Bliss Connect fields
    const userData = {
      ...req.body,
      name,
      phone,
      userType,
      profileStatus: 'incomplete',
      medicalStatus: 'not_booked',
    };
    const user = new BlissUser(userData);
    await user.save();

    // Trigger notification (WhatsApp or log)
    const message = 'Welcome to Bliss Connect. Please book your medical test to continue. Link: /book-medical';
    await sendNotification(user, message);
    return res.status(201).json({ success: true, id: user._id, message: `Registration successful for ${name}`, user });
  } catch (err) {
    next(err);
  }
});

// Login endpoint (backend-only auth)
app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || password === undefined) return res.status(400).json({ success: false, error: 'Missing email or password' });

    const found = users.find(u => u.email === email);
    if (!found) return res.status(404).json({ success: false, error: 'User not found' });

    // For demo: allow login when stored password matches or when user has no password (social accounts)
    if (found.password && found.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Simple token (not secure) for demo purposes
    const token = `token_${generateCode(16)}`;
    return res.status(200).json({ success: true, id: found.id, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get user by email
app.get('/user', (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ success: false, error: 'Missing email' });
    const found = users.find(u => u.email === email);
    if (!found) return res.status(404).json({ success: false, error: 'User not found' });
    return res.status(200).json({ success: true, id: found.id, name: found.name, email: found.email });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Flight Search
app.get('/flightSearch', methodAdvice);
app.post('/flightSearch', (req, res, next) => {
  try {
    const { origin, destination, date } = req.body || {};
    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, error: 'Missing required fields: origin, destination, date' });
    }

    const flights = mockFlights(origin, destination, date);
    return res.status(200).json({ success: true, origin, destination, date, flights });
  } catch (err) {
    next(err);
  }
});

// Hotel Search
app.get('/hotelSearch', methodAdvice);
app.post('/hotelSearch', (req, res, next) => {
  try {
    const { city } = req.body || {};
    if (!city) {
      return res.status(400).json({ success: false, error: 'Missing required field: city' });
    }

    const hotels = mockHotels(city);
    return res.status(200).json({ success: true, city, hotels });
  } catch (err) {
    next(err);
  }
});

// Payment
app.get('/payment', methodAdvice);
app.post('/payment', (req, res, next) => {
  try {
    const { userId, amount } = req.body || {};
    if (!userId || amount === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: userId and amount' });
    }
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Simulate payment processing
    const transactionId = `tx_${generateCode(10)}`;
    console.log('[PAYMENT] processed', { userId, amount: numericAmount, transactionId });

    return res.status(200).json({ success: true, transactionId, message: 'Payment processed successfully' });
  } catch (err) {
    next(err);
  }
});

// Job Application Payments
const jobApplicationPayments = {};

app.post('/api/job-application-payments', (req, res, next) => {
  try {
    const {
      paymentId,
      candidateId,
      jobId,
      fullName,
      phoneNumber,
      paymentMethod,
      transactionCode,
      amount,
      currency,
      status,
      mpesaNumber,
      createdAt,
    } = req.body || {};

    // Validate required fields
    if (!paymentId || !candidateId || !jobId || !transactionCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: paymentId, candidateId, jobId, transactionCode',
      });
    }

    // Check for duplicate transaction code
    const existingPayment = Object.values(jobApplicationPayments).find(
      (p) => p.transactionCode === transactionCode && p.status !== 'failed'
    );
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        error: 'This transaction code has already been used. Please try again.',
      });
    }

    // Store payment locally
    jobApplicationPayments[paymentId] = {
      paymentId,
      candidateId,
      jobId,
      fullName,
      phoneNumber,
      paymentMethod,
      transactionCode,
      amount: Number(amount),
      currency,
      status,
      mpesaNumber,
      createdAt,
      savedAt: new Date().toISOString(),
    };

    console.log('[JOB_APPLICATION_PAYMENT] created', jobApplicationPayments[paymentId]);

    return res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. Await confirmation.',
      paymentId,
      data: jobApplicationPayments[paymentId],
    });
  } catch (err) {
    next(err);
  }
});

// Get job application payment status
app.get('/api/job-application-payments/:paymentId', (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = jobApplicationPayments[paymentId];

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (err) {
    next(err);
  }
});

// Verify job application payment
app.post('/api/job-application-payments/:paymentId/verify', (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = jobApplicationPayments[paymentId];

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Mark as verified
    payment.status = 'verified';
    payment.verifiedAt = new Date().toISOString();

    console.log('[JOB_APPLICATION_PAYMENT] verified', payment);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment,
    });
  } catch (err) {
    next(err);
  }
});

// Get candidate's payments
app.get('/api/job-application-payments/candidate/:candidateId', (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const payments = Object.values(jobApplicationPayments).filter(
      (p) => p.candidateId === candidateId
    );

    return res.status(200).json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (err) {
    next(err);
  }
});

// Example notification triggers (replace with real logic)
app.post('/api/payment-success', async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (user) await notifyPaymentSuccess(user);
  res.sendStatus(200);
});

app.post('/api/registration-success', async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (user) await notifyRegistrationSuccess(user);
  res.sendStatus(200);
});

app.post('/api/application-update', async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (user) await notifyApplicationUpdate(user);
  res.sendStatus(200);
});

// Bulk messaging endpoint (admin only)
app.post('/api/bulk-message', async (req, res) => {
  const { userType, message } = req.body;
  if (!message || !userType) {
    return res.status(400).json({ success: false, error: 'Missing userType or message' });
  }
  try {
    await sendBulkMessages(userType, message);
    res.status(200).json({ success: true, message: 'Bulk message sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Bliss travel backend listening on port ${PORT}`);
  });
}

module.exports = app;
