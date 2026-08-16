// backend/controllers/paymentController.js

const Payment = require('../models/Payment');
const Candidate = require('../models/candidate');
const logger = require('../utils/logger');
const { createCheckoutSession, verifyTransaction } = require('../services/intasendService');
const { applicationFeeConfig } = require('../config/payment');

function normalizeAmount(amount) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : applicationFeeConfig.amount;
}

function sanitizePayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function buildCandidateUpdatePayload({
  payment,
  paymentMethod,
  status,
  transactionId,
  amount,
  paymentReference,
  invoiceId,
  checkoutId,
}) {
  return sanitizePayload({
    paymentStatus: status === 'paid' ? 'Paid' : status === 'failed' ? 'Failed' : 'Pending',
    paymentReference: paymentReference || payment?.paymentReference || transactionId || invoiceId || '',
    paymentMethod: paymentMethod || payment?.paymentMethod || 'mpesa',
    paymentDate: status === 'paid' ? new Date() : undefined,
    transactionId: transactionId || payment?.transactionId || '',
    amount: amount || payment?.amount || 0,
    applicationStatus: status === 'paid' ? 'Application Submitted' : status === 'failed' ? 'Payment Failed' : 'Pending Payment',
  });
}

exports.createPayment = async (req, res, next) => {
  try {
    const {
      candidateId,
      amount,
      paymentMethod = 'mpesa',
      title,
      email,
      fullName,
      phoneNumber,
      metadata = {},
    } = req.body;

    const normalizedPhone = (phoneNumber || (candidateId && typeof candidateId === 'string' ? candidateId : '')).toString().trim();

    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required.' });
    }

    const candidate = (await Candidate.findById(candidateId)) || (await Candidate.findOne({ candidateId }));
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }

    const normalizedAmount = normalizeAmount(amount ?? applicationFeeConfig.amount);

    const checkoutSession = await createCheckoutSession({
      candidate,
      amount: normalizedAmount,
      currency: applicationFeeConfig.currency,
      paymentMethod,
      title: title || applicationFeeConfig.title,
      email: email || candidate.email,
      phoneNumber: phoneNumber || candidate.phone,
      metadata: {
        fullName: fullName || candidate.fullName || candidate.name || '',
        ...metadata,
      },
    });

    const payment = await Payment.create({
      candidateId: candidate._id.toString(),
      phone: phoneNumber || candidate.phone || normalizedPhone || null,
      transactionId: checkoutSession.transactionId || `BLISS-${Date.now()}`,
      invoiceId: checkoutSession.invoiceId || null,
      checkoutId: checkoutSession.checkoutId || null,
      paymentMethod,
      amount: normalizedAmount,
      currency: applicationFeeConfig.currency,
      status: 'pending',
      metadata: {
        checkoutUrl: checkoutSession.checkoutUrl,
        phone: phoneNumber || candidate.phone || normalizedPhone || null,
        ...metadata,
      },
    });

    await Candidate.findByIdAndUpdate(
      candidate._id,
      {
        $set: {
          paymentStatus: 'Pending',
          paymentMethod,
          amount: normalizedAmount,
          applicationStatus: 'Pending Payment',
        },
      },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Payment session created successfully.',
      payment: {
        id: payment._id,
        candidateId: payment.candidateId,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        currency: payment.currency,
        checkoutUrl: checkoutSession.checkoutUrl,
        invoiceId: payment.invoiceId,
        transactionId: payment.transactionId,
      },
    });
  } catch (error) {
    logger.error('Create payment failed', { message: error.message });
    return next(error);
  }
};

exports.createStkPayment = async (req, res, next) => {
  req.body.paymentMethod = 'mpesa';
  return exports.createPayment(req, res, next);
};

exports.createCardPayment = async (req, res, next) => {
  req.body.paymentMethod = 'card';
  return exports.createPayment(req, res, next);
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, candidateId, transactionId } = req.body;

    if (!paymentId && !candidateId && !transactionId) {
      return res.status(400).json({ success: false, error: 'paymentId, candidateId, or transactionId is required.' });
    }

    const query = paymentId ? { _id: paymentId } : candidateId ? { candidateId } : { transactionId };
    const payment = await Payment.findOne(query).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found.' });
    }

    if (payment.status === 'paid' || payment.status === 'completed') {
      const candidate = await Candidate.findOne({ candidateId: payment.candidateId });
      return res.status(200).json({ 
        success: true, 
        message: 'Payment already verified.', 
        payment: {
          ...payment.toObject ? payment.toObject() : payment,
          candidateId: candidate?.candidateId || payment.candidateId,
          uniqueCode: candidate?.uniqueCode || null
        }
      });
    }

    const remoteVerification = await verifyTransaction(payment.transactionId || transactionId);
    const paymentVerified = remoteVerification?.status === 'paid' || remoteVerification?.status === 'successful' || remoteVerification?.data?.status === 'paid';

    if (paymentVerified) {
      payment.status = 'paid';
      payment.updatedAt = new Date();
      await payment.save();

      const candidate = await Candidate.findById(payment.candidateId);
      if (candidate) {
        const updatePayload = buildCandidateUpdatePayload({
          payment,
          paymentMethod: payment.paymentMethod,
          status: 'paid',
          transactionId: payment.transactionId,
          amount: payment.amount,
          paymentReference: payment.invoiceId || payment.transactionId,
          invoiceId: payment.invoiceId,
          checkoutId: payment.checkoutId,
        });
        await Candidate.findByIdAndUpdate(candidate._id, { $set: updatePayload }, { new: true });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified successfully.', 
        payment: {
          ...payment.toObject ? payment.toObject() : payment,
          candidateId: candidate?.candidateId || payment.candidateId,
          uniqueCode: candidate?.uniqueCode || null
        }
      });
    }

    return res.status(200).json({ 
      success: false, 
      message: 'Payment is still pending or could not be verified yet.', 
      payment: {
        ...payment.toObject ? payment.toObject() : payment,
        candidateId: payment.candidateId
      }
    });
  } catch (error) {
    logger.error('Payment verification failed', { message: error.message });
    return next(error);
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const event = req.body || {};
    const paymentReference = event.payment_reference || event.paymentReference || event.invoice_id || event.invoiceId || event.transaction_id || event.transactionId || event.id;
    const transactionId = event.transaction_id || event.transactionId || event.id || paymentReference;
    const invoiceId = event.invoice_id || event.invoiceId;
    const checkoutId = event.checkout_id || event.checkoutId;
    const paymentMethod = event.payment_method || event.paymentMethod || 'mpesa';
    const amount = Number(event.amount || event.total_amount || event.amount_paid || 0);
    const status = event.status === 'paid' || event.status === 'successful' || event.status === 'completed' ? 'paid' : event.status === 'failed' ? 'failed' : 'pending';

    logger.info('Received IntaSend webhook', { transactionId, status, paymentReference });

    const payment = await Payment.findOne({
      $or: [
        { transactionId },
        { invoiceId },
        { checkoutId },
        { 'metadata.paymentReference': paymentReference },
      ],
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found for webhook payload.' });
    }

    if (status === 'paid') {
      payment.status = 'paid';
      payment.paymentMethod = paymentMethod;
      payment.transactionId = transactionId;
      payment.invoiceId = invoiceId || payment.invoiceId;
      payment.checkoutId = checkoutId || payment.checkoutId;
      payment.amount = amount || payment.amount;
      payment.metadata = { ...payment.metadata, ...event };
      await payment.save();

      const candidate = await Candidate.findById(payment.candidateId);
      if (candidate) {
        const updatePayload = buildCandidateUpdatePayload({
          payment,
          paymentMethod,
          status: 'paid',
          transactionId,
          amount: payment.amount,
          paymentReference,
          invoiceId,
          checkoutId,
        });
        await Candidate.findByIdAndUpdate(candidate._id, { $set: updatePayload }, { new: true });
      }
    } else if (status === 'failed') {
      payment.status = 'failed';
      payment.metadata = { ...payment.metadata, ...event };
      await payment.save();

      const candidate = await Candidate.findById(payment.candidateId);
      if (candidate) {
        const updatePayload = buildCandidateUpdatePayload({
          payment,
          paymentMethod,
          status: 'failed',
          transactionId,
          amount: payment.amount,
          paymentReference,
          invoiceId,
          checkoutId,
        });
        await Candidate.findByIdAndUpdate(candidate._id, { $set: updatePayload }, { new: true });
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
  } catch (error) {
    logger.error('Webhook processing failed', { message: error.message });
    return next(error);
  }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Payment id is required.' });
    }

    const payment = await Payment.findOne({
      $or: [
        { _id: id },
        { candidateId: id },
        { transactionId: id },
      ],
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }

    const candidate = await Candidate.findById(payment.candidateId);

    return res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        candidateId: payment.candidateId,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId,
        invoiceId: payment.invoiceId,
        checkoutId: payment.checkoutId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      candidate: candidate
        ? {
            id: candidate._id,
            applicationStatus: candidate.applicationStatus,
            paymentStatus: candidate.paymentStatus,
            paymentReference: candidate.paymentReference,
            paymentMethod: candidate.paymentMethod,
            paymentDate: candidate.paymentDate,
            transactionId: candidate.transactionId,
            amount: candidate.amount,
          }
        : null,
    });
  } catch (error) {
    logger.error('Payment status lookup failed', { message: error.message });
    return next(error);
  }
};