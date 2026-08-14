/**
 * Unified Deployment Payment Handler
 * Handles both local and international deployment payments
 * Bank Account: GEORGE MBURU KAGIA @ STANBIC BANK KENYA LIMITED
 */

const BANK_ACCOUNT_DETAILS = {
  accountName: 'GEORGE MBURU KAGIA',
  accountNumber: '0100011879308',
  bankName: 'STANBIC BANK KENYA LIMITED',
  swiftBic: 'SBICKENX',
  bankAddress: 'JOMO KENYATTA BRANCH NAIROBI',
  mpesaPaybill: '600100',
  mpesaAccountNumber: '0100011879308',
};

// Deployment fee constants
const FEES = {
  INTERNATIONAL_FIXED: 1500.0, // USD 1500 for international deployments
  LOCAL_PERCENTAGE: 0.60, // 60% of salary for local deployments
  CURRENCY: 'USD',
};

/**
 * Calculate deployment fee based on type and location
 * @param {String} deploymentType - 'local' or 'international'
 * @param {Number} salary - Candidate salary (for local deployments)
 * @returns {Object} - { fee, breakdown }
 */
function calculateDeploymentFee(deploymentType, salary = 0) {
  if (deploymentType === 'international') {
    return {
      fee: FEES.INTERNATIONAL_FIXED,
      breakdown: {
        baseDeploymentFee: FEES.INTERNATIONAL_FIXED,
        currency: FEES.CURRENCY,
      },
      description: `Fixed international deployment fee of USD ${FEES.INTERNATIONAL_FIXED}`,
    };
  } else if (deploymentType === 'local') {
    const candidateSalary = Number(salary) || 0;
    const deploymentFee = candidateSalary * FEES.LOCAL_PERCENTAGE;
    return {
      fee: deploymentFee,
      breakdown: {
        candidateSalary,
        feePercentage: FEES.LOCAL_PERCENTAGE * 100,
        deploymentFee: parseFloat(deploymentFee.toFixed(2)),
        currency: FEES.CURRENCY,
      },
      description: `Local deployment fee: ${FEES.LOCAL_PERCENTAGE * 100}% of salary (${FEES.CURRENCY} ${deploymentFee.toFixed(2)})`,
    };
  }
  
  throw new Error(`Invalid deployment type: ${deploymentType}`);
}

/**
 * Validate payment request
 * @param {Object} req - Express request object
 * @returns {Object} - { isValid, error }
 */
function validatePaymentRequest(req) {
  const {
    deploymentType,
    candidateId,
    candidateName,
    jobPosition,
    jobLocation,
    salary,
    paymentMethod,
  } = req.body;

  // Validate required fields
  if (!deploymentType || !['local', 'international'].includes(deploymentType)) {
    return { isValid: false, error: 'Invalid or missing deploymentType' };
  }

  if (!candidateId || !candidateName || !jobPosition) {
    return {
      isValid: false,
      error: 'Missing required fields: candidateId, candidateName, jobPosition',
    };
  }

  if (!paymentMethod || !['bank', 'mobile'].includes(paymentMethod)) {
    return { isValid: false, error: 'Invalid payment method' };
  }

  // Validate salary for local deployments
  if (deploymentType === 'local' && !salary) {
    return { isValid: false, error: 'Salary is required for local deployments' };
  }

  return { isValid: true };
}

/**
 * Format bank account details for display
 */
function getBankDetails() {
  return {
    accountName: BANK_ACCOUNT_DETAILS.accountName,
    accountNumber: BANK_ACCOUNT_DETAILS.accountNumber,
    bankName: BANK_ACCOUNT_DETAILS.bankName,
    swiftBic: BANK_ACCOUNT_DETAILS.swiftBic,
    bankAddress: BANK_ACCOUNT_DETAILS.bankAddress,
    formattedDetails: `
Account Name: ${BANK_ACCOUNT_DETAILS.accountName}
Account Number: ${BANK_ACCOUNT_DETAILS.accountNumber}
Bank: ${BANK_ACCOUNT_DETAILS.bankName}
SWIFT/BIC: ${BANK_ACCOUNT_DETAILS.swiftBic}
Address: ${BANK_ACCOUNT_DETAILS.bankAddress}
    `.trim(),
  };
}

/**
 * Format M-PESA payment details for display
 */
function getMpesaDetails() {
  return {
    paybill: BANK_ACCOUNT_DETAILS.mpesaPaybill,
    accountNumber: BANK_ACCOUNT_DETAILS.mpesaAccountNumber,
    formattedDetails: `
Paybill: ${BANK_ACCOUNT_DETAILS.mpesaPaybill}
Account Number: ${BANK_ACCOUNT_DETAILS.mpesaAccountNumber}
    `.trim(),
  };
}

module.exports = {
  BANK_ACCOUNT_DETAILS,
  FEES,
  calculateDeploymentFee,
  validatePaymentRequest,
  getBankDetails,
  getMpesaDetails,
};
