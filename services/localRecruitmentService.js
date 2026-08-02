function calculateDeploymentFees(firstMonthGrossSalary) {
  const grossSalary = Number(firstMonthGrossSalary || 0);
  return {
    employerFee: grossSalary * 0.5,
    candidateFee: grossSalary * 0.1,
    totalDue: grossSalary * 0.6,
    currency: 'KES',
  };
}

function buildDeploymentSummary({ candidateName, grossSalary, paymentMethod }) {
  const fees = calculateDeploymentFees(grossSalary);
  return {
    candidateName: candidateName || 'Candidate',
    grossSalary: Number(grossSalary || 0),
    employerFee: fees.employerFee,
    candidateFee: fees.candidateFee,
    totalDue: fees.totalDue,
    paymentMethod: paymentMethod || 'bank_transfer',
    currency: fees.currency,
    status: 'payment_pending',
  };
}

module.exports = {
  calculateDeploymentFees,
  buildDeploymentSummary,
};
