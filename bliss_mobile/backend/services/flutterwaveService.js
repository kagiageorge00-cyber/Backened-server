// backend/services/flutterwaveService.js

const axios = require("axios");

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// ⚠️ put this in .env in production
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || "FLW_SECRET_KEY_HERE";

/**
 * Initialize payment
 */
const initializePayment = async ({
  amount,
  email,
  name,
  tx_ref,
  currency = "KES",
}) => {
  try {
    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
        tx_ref,
        amount,
        currency,
        redirect_url: "https://your-backend.com/api/payment/flutterwave/callback",

        customer: {
          email,
          name,
        },

        customizations: {
          title: "Bliss Connect Payment",
          description: "Job payment",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      link: response.data.data.link, // payment link
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message || "Flutterwave init failed",
    };
  }
};

/**
 * Verify payment
 */
const verifyPayment = async (transactionId) => {
  try {
    const response = await axios.get(
      `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    if (data.status === "successful") {
      return {
        success: true,
        amount: data.amount,
        currency: data.currency,
        tx_ref: data.tx_ref,
        transactionId: data.id,
      };
    }

    return { success: false };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message || "Verification failed",
    };
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
};