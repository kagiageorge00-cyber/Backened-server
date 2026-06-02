// models/PaymentSubmission.js

const mongoose = require("mongoose");

const paymentSubmissionSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    transactionCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 5,
    },

    paymentMethod: {
      type: String,
      enum: ["mpesa", "bank", "card", "cash"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "KES",
      uppercase: true,
    },

    // ======================
    // BANK DETAILS (OPTIONAL)
    // ======================
    bankAccountName: {
      type: String,
      trim: true,
    },

    bankName: {
      type: String,
      trim: true,
    },

    bankAccountNumber: {
      type: String,
      trim: true,
    },

    // ======================
    // STATUS CONTROL
    // ======================
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // ======================
    // OPTIONAL ADMIN NOTES
    // ======================
    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ======================
// INDEXES (PERFORMANCE)
// ======================
paymentSubmissionSchema.index({ transactionCode: 1 });
paymentSubmissionSchema.index({ candidateId: 1, status: 1 });

// ======================
// AUTO-UPDATE ON APPROVAL
// ======================
paymentSubmissionSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "approved") {
    this.verified = true;
    this.approvedAt = new Date();
  }
  next();
});

// ======================
// SAFE EXPORT
// ======================
const PaymentSubmission =
  mongoose.models.PaymentSubmission ||
  mongoose.model("PaymentSubmission", paymentSubmissionSchema);

module.exports = PaymentSubmission;