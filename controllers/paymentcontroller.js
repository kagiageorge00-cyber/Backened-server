// backend/controllers/paymentController.js

const { v4: uuidv4 } = require("uuid");
const Payment = require("../models/payment");
const { stkPush } = require("../services/mpesaService");
const flutterwaveService = require("../services/flutterwaveService");


// ================= CREATE INTENT =================
exports.createIntent = async (req, res) => {
  try {
    const { userId, amount, title } = req.body;

    if (!userId || !amount || !title) {
      return res.status(400).json({
        success: false,
        error: "userId, amount and title are required",
      });
    }

    const intentId = uuidv4();

    const payment = await Payment.create({
      intentId,
      userId,
      amount,
      title,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      intentId,
      payment,
    });
  } catch (error) {
    console.error("Create Intent Error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create payment intent",
    });
  }
};


// ================= MPESA PAYMENT =================
exports.payWithMpesa = async (req, res) => {
  try {
    const { intentId, phone } = req.body;

    if (!intentId || !phone) {
      return res.status(400).json({
        success: false,
        error: "intentId and phone are required",
      });
    }

    const payment = await Payment.findOne({ where: { intentId } });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment intent not found",
      });
    }

    // format phone (2547XXXXXXXX)
    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.substring(1)
      : phone;

    const response = await stkPush({
      phone: formattedPhone,
      amount: payment.amount,
      accountReference: intentId,
      transactionDesc: payment.title,
    });

    if (!response.success) {
      return res.status(400).json(response);
    }

    // save checkout request ID
    await payment.update({
      transactionId: response.checkoutRequestId,
      status: "processing",
    });

    return res.json({
      success: true,
      message: "STK push sent",
      checkoutRequestId: response.checkoutRequestId,
    });
  } catch (error) {
    console.error("MPESA Error:", error);

    return res.status(500).json({
      success: false,
      error: "MPESA payment failed",
    });
  }
};


// ================= FLUTTERWAVE PAYMENT =================
exports.payWithFlutterwave = async (req, res) => {
  try {
    const { intentId, email, name } = req.body;

    if (!intentId || !email || !name) {
      return res.status(400).json({
        success: false,
        error: "intentId, email and name are required",
      });
    }

    const payment = await Payment.findOne({ where: { intentId } });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment intent not found",
      });
    }

    const response = await flutterwaveService.initializePayment({
      amount: payment.amount,
      email,
      name,
      tx_ref: intentId,
    });

    if (!response.success) {
      return res.status(400).json(response);
    }

    // save reference
    await payment.update({
      status: "processing",
      transactionId: intentId,
    });

    return res.json({
      success: true,
      link: response.link, // redirect user to this
    });
  } catch (error) {
    console.error("Flutterwave Error:", error);

    return res.status(500).json({
      success: false,
      error: "Flutterwave payment failed",
    });
  }
};


// ================= VERIFY PAYMENT =================
exports.verifyPayment = async (req, res) => {
  try {
    const { intentId } = req.params;

    const payment = await Payment.findOne({ where: { intentId } });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    return res.json({
      success: true,
      status: payment.status,
      payment,
    });
  } catch (error) {
    console.error("Verify Error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to verify payment",
    });
  }
};