const express = require('express');
const TravelUser = require('../models/TravelUser');
const TravelVisaApplication = require('../models/TravelVisaApplication');
const TravelFlightBooking = require('../models/TravelFlightBooking');
const TravelHolidayBooking = require('../models/TravelHolidayBooking');
const { createCheckoutSession } = require('../services/intasendService');
const { generateInvoicePdf } = require('../services/invoiceService');
const { searchFlights, priceFlightOffer, createFlightBooking, getMarginBreakdown } = require('../services/amadeusService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const uploadDir = path.join(__dirname, '..', 'tmp', 'visa_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });
const router = express.Router();

const validateRegistration = (payload) => {
  const { name, email, phone, password, country, nationality } = payload || {};
  if (!name || !email || !phone || !password || !country || !nationality) {
    return 'Please provide name, email, phone, password, country, and nationality.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
};

router.post('/travel/register', async (req, res) => {
  try {
    const validationError = validateRegistration(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const existingUser = await TravelUser.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'A travel account already exists for that email or phone.' });
    }

    const user = await TravelUser.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      country: req.body.country,
      nationality: req.body.nationality,
      role: req.body.role || 'customer',
    });

    const token = user.generateToken();
    return res.status(201).json({ success: true, token, user: user.toPublicJSON() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/travel/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await TravelUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Travel account not found.' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    return res.json({ success: true, token: user.generateToken(), user: user.toPublicJSON() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/travel/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travel-secret');
    const user = await TravelUser.findById(decoded.sub);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    return res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
});

router.post('/visa/apply', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.fullName || !payload.passportNumber || !payload.destinationCountry || !payload.visaType || !payload.email) {
      return res.status(400).json({ success: false, error: 'Missing required visa application fields.' });
    }

    const applicationNumber = `VISA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = await TravelVisaApplication.create({
      ...payload,
      applicationNumber,
      userId: payload.userId || null,
      fee: Number(payload.fee || 0),
    });

    return res.status(201).json({ success: true, application: record });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Upload supporting document for a visa application
router.post('/visa/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const id = req.params.id;
    const appRecord = await TravelVisaApplication.findById(id);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application not found.' });

    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    // Persist file path on record
    const savedPath = req.file.path;
    appRecord.documentPath = savedPath;
    appRecord.status = 'document_uploaded';
    await appRecord.save();

    // Send notification (email) if SMTP configured, otherwise log
    const to = appRecord.email || appRecord.contactEmail || null;
    if (to && process.env.SMTP_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: (process.env.SMTP_SECURE === 'true'),
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@blissconnect.com',
          to,
          subject: 'Visa Document Received',
          text: `We have received your document for application ${appRecord.applicationNumber || id}.`,
        });
      } catch (e) {
        console.error('Notification email failed', e);
      }
    } else {
      console.log(`Notification: Received visa doc for ${id} (no email sent)`);
    }

    return res.json({ success: true, application: appRecord });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/visa/:id', async (req, res) => {
  try {
    const record = await TravelVisaApplication.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Visa application not found.' });
    }
    return res.json({ success: true, application: record });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/flights/search', async (req, res) => {
  try {
    const { origin, destination, departureDate, adults, travelClass, returnDate } = req.body || {};
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ success: false, error: 'origin, destination, and departureDate are required.' });
    }

    const flights = await searchFlights({ origin, destination, departureDate, adults, travelClass, returnDate });
    return res.json({ success: true, flights, marginPolicy: '30% markup automatically added to base Amadeus price' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/flights/price', async (req, res) => {
  try {
    const offer = req.body || {};
    if (!offer) return res.status(400).json({ success: false, error: 'Offer payload is required.' });

    const pricedOffer = await priceFlightOffer(offer);
    return res.json({ success: true, pricedOffer });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/flights/book', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.userId || !payload.bookingReference || !payload.airline) {
      return res.status(400).json({ success: false, error: 'userId, bookingReference, and airline are required.' });
    }

    const baseAmount = Number(payload.amount || payload.baseAmount || 0);
    const margin = getMarginBreakdown(baseAmount);
    const record = await TravelFlightBooking.create({
      ...payload,
      amount: margin.finalAmount,
      marginAmount: margin.marginAmount,
      marginPercentage: margin.marginPercentage,
      currency: payload.currency || 'KES',
      status: payload.status || 'confirmed',
      paymentStatus: payload.paymentStatus || 'pending',
    });
    return res.status(201).json({ success: true, booking: record, pricing: margin });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/flights/:id', async (req, res) => {
  try {
    const record = await TravelFlightBooking.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Flight booking not found.' });
    }
    return res.json({ success: true, booking: record });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/holidays', async (req, res) => {
  try {
    return res.json({ success: true, holidays: [
      { id: 'pkg-dubai-01', name: 'Dubai City Escape', destination: 'Dubai', price: 900 },
      { id: 'pkg-kenya-01', name: 'Kenya Safari', destination: 'Nairobi', price: 1200 },
    ] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/holidays/book', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.userId || !payload.packageName || !payload.destination || !payload.travelDate) {
      return res.status(400).json({ success: false, error: 'Missing holiday booking fields.' });
    }

    const baseAmount = Number(payload.amount || payload.baseAmount || 0);
    const margin = getMarginBreakdown(baseAmount);
    const record = await TravelHolidayBooking.create({
      ...payload,
      amount: margin.finalAmount,
      marginAmount: margin.marginAmount,
      marginPercentage: margin.marginPercentage,
      currency: payload.currency || 'KES',
      status: payload.status || 'confirmed',
      depositPaid: Boolean(payload.depositPaid || false),
    });
    return res.status(201).json({ success: true, booking: record, pricing: margin });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/payments/intasend', async (req, res) => {
  try {
    const payload = req.body || {};
    const bookingAmount = Number(payload.amount || payload.totalAmount || 0);
    const margin = getMarginBreakdown(bookingAmount);
    const checkout = await createCheckoutSession({
      candidate: payload.candidate || payload,
      amount: margin.finalAmount,
      currency: payload.currency || 'KES',
      paymentMethod: payload.paymentMethod || 'card',
      title: payload.title || 'Travel Service Payment',
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      metadata: {
        bookingId: payload.bookingId || '',
        bookingType: payload.bookingType || 'flight',
        baseAmount: bookingAmount,
        marginPercentage: margin.marginPercentage,
        marginAmount: margin.marginAmount,
        ...payload.metadata,
      },
    });

    return res.json({ success: true, checkout });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to query payment/booking status
router.get('/payments/status/:bookingId', async (req, res) => {
  try {
    const id = req.params.bookingId;
    let booking = await TravelFlightBooking.findById(id);
    let type = 'flight';
    if (!booking) {
      booking = await TravelHolidayBooking.findById(id);
      type = 'hotel';
    }

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

    return res.json({ success: true, booking: booking.toObject(), type });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Simple webhook handler for IntaSend payment notifications
router.post('/payments/intasend/webhook', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const event = req.body || {};
    // Example expected shape: { type: 'payment.completed', data: { metadata: { bookingId, bookingType }, amount, currency, payer } }
    const evType = event.type || event.event || 'unknown';
    if (evType !== 'payment.completed' && evType !== 'payment.succeeded') {
      return res.status(200).json({ success: true, ignored: true });
    }

    const data = event.data || event;
    const metadata = (data.metadata) || {};
    const bookingId = metadata.bookingId || metadata.booking_id || (data.reference || '').split('_').pop();
    const bookingType = metadata.bookingType || metadata.booking_type || 'flight';

    let booking = null;
    if (bookingType === 'hotel') booking = await TravelHolidayBooking.findById(bookingId);
    else booking = await TravelFlightBooking.findById(bookingId);

    if (!booking) {
      // Could not find booking, store as external transaction log in future
      return res.status(404).json({ success: false, error: 'Booking not found for provided metadata.' });
    }

    // Mark payment verified
    booking.status = 'payment_verified';
    booking.paymentDate = new Date();
    booking.paymentDetails = { raw: data };
    await booking.save();

    // Generate invoice PDF
    try {
      const invoice = await generateInvoicePdf({
        bookingId: booking.id || booking._id,
        type: bookingType === 'hotel' ? 'hotel' : 'flight',
        customer: { name: booking.guest_name || booking.customerName || booking.customer || '' , email: booking.guest_email || booking.email },
        items: [ { description: booking.packageName || booking.flight_id || 'Booking', amount: data.amount || booking.total_amount || 0 } ],
        total: data.amount || booking.total_amount || 0,
        currency: data.currency || booking.currency || 'USD'
      });
      booking.invoicePath = invoice.path;
      booking.invoiceFile = invoice.filename;
      await booking.save();
    } catch (e) {
      console.error('Invoice generation failed', e);
    }

    return res.json({ success: true, bookingId: booking.id || booking._id });
  } catch (error) {
    console.error('Webhook error', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Serve generated invoice PDF for a booking
router.get('/payments/invoice/:bookingId', async (req, res) => {
  try {
    const id = req.params.bookingId;
    let booking = await TravelFlightBooking.findById(id);
    if (!booking) booking = await TravelHolidayBooking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

    const invoicePath = booking.invoicePath || booking.invoice_path;
    if (!invoicePath) return res.status(404).json({ success: false, error: 'Invoice not available.' });

    return res.sendFile(invoicePath);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
