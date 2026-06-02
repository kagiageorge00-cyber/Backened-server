// models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    userType: {
      type: String,
      enum: ["candidate", "employer", "agent", "admin"],
      default: "candidate",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // optional: link to candidate profile
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
    },
  },
  {
    timestamps: true,
  }
);

// ======================
// 🔐 HASH PASSWORD BEFORE SAVE
// ======================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ======================
// 🔑 COMPARE PASSWORD
// ======================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ======================
// INDEXES
// ======================
userSchema.index({ email: 1 });

// ======================
// SAFE EXPORT
// ======================
const User =
  mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;