// models/Payment.js

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    intentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: String, // can later change to ObjectId if linking to User
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    method: {
      type: String,
      enum: ["mpesa", "card", "flutterwave", "cash"],
      default: "mpesa",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "failed"],
      default: "pending",
      index: true,
    },

    transactionId: {
      type: String,
      trim: true,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed, // more flexible than Object
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ======================
// INDEXES (FAST QUERIES)
// ======================
paymentSchema.index({ userId: 1, status: 1 });

// ======================
// EXPORT SAFE MODEL
// ======================
const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

module.exports = Payment;