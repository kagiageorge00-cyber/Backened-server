const MedicalBooking = require('../models/MedicalBooking');
const Candidate = require('../models/candidate');
const { sendEmail } = require('../email');
const { sendWhatsAppNotification } = require('../services/whatsappService');

// Submit medical booking
exports.submitMedicalBooking = async (req, res) => {
  try {
    const {
      candidateId,
      fullName,
      phoneNumber,
      mpesaReference,
      location,
      medicalType,
      amount,
      paymentMethod,
      email,
    } = req.body;

    // Validation
    if (!candidateId || !fullName || !phoneNumber || !mpesaReference || !location || !medicalType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateId, fullName, phoneNumber, mpesaReference, location, medicalType',
      });
    }

    // Validate location
    if (!['nairobi', 'eldoret'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid location. Must be "nairobi" or "eldoret"',
      });
    }

    // Validate medical type
    if (!['employer_request', 'before_travel'].includes(medicalType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid medical type. Must be "employer_request" or "before_travel"',
      });
    }

    // Check if MPESA reference already exists
    const existingBooking = await MedicalBooking.findOne({ mpesaReference });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'MPESA reference already used. Please check your reference code.',
      });
    }

    // Create medical booking
    const medicalBooking = new MedicalBooking({
      candidateId,
      fullName,
      phoneNumber,
      email: email || '',
      mpesaReference,
      location,
      medicalType,
      amount: amount || 7500,
      paymentMethod: paymentMethod || 'mpesa',
      status: 'pending_approval',
      bookingDate: new Date(),
    });

    // Save to database
    await medicalBooking.save();

    // Send notification to candidate
    try {
      // WhatsApp notification
      await sendWhatsAppNotification({
        phoneNumber,
        templateName: 'medical_booking_received',
        parameters: {
          name: fullName,
          amount: amount || 7500,
          location: location === 'nairobi' ? 'Nairobi' : 'Eldoret',
          medicalType: medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel',
          referenceCode: mpesaReference,
        },
      }).catch(err => console.error('WhatsApp notification failed:', err));

      // Email notification
      if (email) {
        await sendEmail(
          email,
          'Medical Booking Submitted - Bliss Connect',
          `Dear ${fullName},\n\nThank you for submitting your medical booking request.\n\nBooking Details:\n- Amount: KES 7,500\n- Location: ${location === 'nairobi' ? 'Nairobi' : 'Eldoret'}\n- Medical Type: ${medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel'}\n- M-PESA Reference: ${mpesaReference}\n\nOur admin team will verify your payment and contact you within 24 hours.\n\nBest regards,\nBliss Connect Team`,
          `
            <h2>Medical Booking Submitted</h2>
            <p>Dear ${fullName},</p>
            <p>Thank you for submitting your medical booking request!</p>
            <p><strong>Booking Details:</strong></p>
            <ul>
              <li>Amount: KES 7,500</li>
              <li>Location: ${location === 'nairobi' ? 'Nairobi' : 'Eldoret'}</li>
              <li>Medical Type: ${medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel'}</li>
              <li>M-PESA Reference: ${mpesaReference}</li>
            </ul>
            <p>Our admin team will verify your payment and contact you within 24 hours.</p>
            <p>Best regards,<br/>Bliss Connect Team</p>
          `
        ).catch(err => console.error('Email notification failed:', err));
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    // Send notification to admin
    try {
      const adminEmails = [process.env.ADMIN_EMAIL, process.env.SUPPORT_EMAIL].filter(Boolean);
      for (const adminEmail of adminEmails) {
        await sendEmail(
          adminEmail,
          `NEW: Medical Booking Payment Pending Verification - ${fullName}`,
          `Candidate: ${fullName}\nPhone: ${phoneNumber}\nEmail: ${email || 'N/A'}\nM-PESA Reference: ${mpesaReference}\nAmount: KES 7,500\nLocation: ${location === 'nairobi' ? 'Nairobi' : 'Eldoret'}\nMedical Type: ${medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel'}\nStatus: Pending Approval\nPlease verify the M-PESA payment and approve or reject the booking.`,
          `
            <h2>Medical Booking Payment Received - Pending Verification</h2>
            <p><strong>Candidate:</strong> ${fullName}</p>
            <p><strong>Phone:</strong> ${phoneNumber}</p>
            <p><strong>Email:</strong> ${email || 'N/A'}</p>
            <p><strong>M-PESA Reference:</strong> ${mpesaReference}</p>
            <p><strong>Amount:</strong> KES 7,500</p>
            <p><strong>Location:</strong> ${location === 'nairobi' ? 'Nairobi' : 'Eldoret'}</p>
            <p><strong>Medical Type:</strong> ${medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel'}</p>
            <p><strong>Status:</strong> <span style="color: orange;">Pending Approval</span></p>
            <p>Please verify the M-PESA payment and approve or reject the booking.</p>
            <p><strong>Action Required:</strong> Review M-PESA reference and confirm payment</p>
          `
        ).catch(err => console.error('Admin email notification failed:', err));
      }
    } catch (adminNotificationError) {
      console.error('Error sending admin notifications:', adminNotificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Medical booking submitted successfully',
      data: {
        bookingId: medicalBooking._id,
        status: medicalBooking.status,
        bookingDate: medicalBooking.bookingDate,
      },
    });
  } catch (error) {
    console.error('Error submitting medical booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit medical booking',
    });
  }
};

// Get candidate's medical bookings
exports.getCandidateMedicalBookings = async (req, res) => {
  try {
    const { candidateId } = req.params;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId is required',
      });
    }

    const bookings = await MedicalBooking.find({ candidateId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Error fetching candidate medical bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch medical bookings',
    });
  }
};

// Get all pending medical bookings (Admin)
exports.getPendingMedicalBookings = async (req, res) => {
  try {
    const bookings = await MedicalBooking.find({ status: 'pending_approval' })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching pending medical bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pending medical bookings',
    });
  }
};

// Approve medical booking (Admin)
exports.approveMedicalBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { approvedBy, notes, scheduledDate } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId is required',
      });
    }

    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Medical booking not found',
      });
    }

    // Update booking
    booking.status = 'approved';
    booking.approvalDate = new Date();
    booking.approvedBy = approvedBy || 'admin';
    if (notes) booking.notes = notes;
    if (scheduledDate) booking.scheduledDate = new Date(scheduledDate);
    booking.updatedAt = new Date();

    await booking.save();

    // Send approval notification to candidate
    try {
      const medicalCenter = booking.location === 'nairobi' ? 'Nairobi Medical Center' : 'Eldoret Medical Center';
      
      await sendWhatsAppNotification({
        phoneNumber: booking.phoneNumber,
        templateName: 'medical_booking_approved',
        parameters: {
          name: booking.fullName,
          location: medicalCenter,
          medicalType: booking.medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel',
          nextSteps: 'Your medical booking has been approved. Please visit the center during business hours with your ID.',
        },
      }).catch(err => console.error('WhatsApp approval notification failed:', err));

      // Email notification
      if (booking.email) {
        await sendEmail(
          booking.email,
          'Medical Booking Approved - Bliss Connect',
          `Dear ${booking.fullName},\n\nGreat news! Your medical booking has been approved.\n\nAppointment Details:\n- Medical Center: ${medicalCenter}\n- Medical Type: ${booking.medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel'}${scheduledDate ? `\n- Scheduled Date: ${new Date(scheduledDate).toLocaleDateString()}` : ''}\n\nPlease visit the medical center during business hours with a valid ID.\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nBliss Connect Team`,
          `
            <h2>Medical Booking Approved!</h2>
            <p>Dear ${booking.fullName},</p>
            <p>Great news! Your medical booking has been approved.</p>
            <p><strong>Appointment Details:</strong></p>
            <ul>
              <li>Medical Center: ${medicalCenter}</li>
              <li>Medical Type: ${booking.medicalType === 'employer_request' ? "Employer's Request" : 'Before Travel'}</li>
              ${scheduledDate ? `<li>Scheduled Date: ${new Date(scheduledDate).toLocaleDateString()}</li>` : ''}
            </ul>
            <p>Please visit the medical center during business hours with a valid ID.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br/>Bliss Connect Team</p>
          `
        ).catch(err => console.error('Email approval notification failed:', err));
      }
    } catch (notificationError) {
      console.error('Error sending approval notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Medical booking approved successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error approving medical booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve medical booking',
    });
  }
};

// Reject medical booking (Admin)
exports.rejectMedicalBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId is required',
      });
    }

    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Medical booking not found',
      });
    }

    // Update booking
    booking.status = 'rejected';
    booking.notes = reason || 'Rejected by admin';
    booking.updatedAt = new Date();

    await booking.save();

    // Send rejection notification to candidate
    try {
      await sendWhatsAppNotification({
        phoneNumber: booking.phoneNumber,
        templateName: 'medical_booking_rejected',
        parameters: {
          name: booking.fullName,
          reason: reason || 'Your booking could not be verified. Please contact support.',
        },
      }).catch(err => console.error('WhatsApp rejection notification failed:', err));

      if (booking.email) {
        await sendEmail(
          booking.email,
          'Medical Booking Status Update - Bliss Connect',
          `Dear ${booking.fullName},\n\nYour medical booking request could not be approved.\n\nReason: ${reason || 'Please verify your payment details and contact support'}\n\nPlease contact our support team for assistance.\n\nBest regards,\nBliss Connect Team`,
          `
            <h2>Medical Booking Status</h2>
            <p>Dear ${booking.fullName},</p>
            <p>Your medical booking request could not be approved.</p>
            <p><strong>Reason:</strong> ${reason || 'Please verify your payment details and contact support'}</p>
            <p>Please contact our support team for assistance.</p>
            <p>Best regards,<br/>Bliss Connect Team</p>
          `
        ).catch(err => console.error('Email rejection notification failed:', err));
      }
    } catch (notificationError) {
      console.error('Error sending rejection notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Medical booking rejected',
      data: booking,
    });
  } catch (error) {
    console.error('Error rejecting medical booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject medical booking',
    });
  }
};

// Get medical booking by ID
exports.getMedicalBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId is required',
      });
    }

    const booking = await MedicalBooking.findById(bookingId).lean();
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Medical booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching medical booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch medical booking',
    });
  }
};

// Get medical booking statistics (Admin)
exports.getMedicalBookingStats = async (req, res) => {
  try {
    const stats = await MedicalBooking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalBookings = await MedicalBooking.countDocuments();
    const totalRevenue = await MedicalBooking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching medical booking stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch medical booking statistics',
    });
  }
};
