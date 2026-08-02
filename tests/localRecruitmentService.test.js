const { calculateDeploymentFees, buildDeploymentSummary } = require('../services/localRecruitmentService');

describe('local recruitment service', () => {
  test('calculates employer and candidate deployment fees from gross salary', () => {
    const summary = calculateDeploymentFees(60000);

    expect(summary.employerFee).toBe(30000);
    expect(summary.candidateFee).toBe(6000);
    expect(summary.totalDue).toBe(36000);
  });

  test('builds a deployment summary with the expected ledger fields', () => {
    const summary = buildDeploymentSummary({ candidateName: 'Jane Doe', grossSalary: 48000, paymentMethod: 'bank_transfer' });

    expect(summary.candidateName).toBe('Jane Doe');
    expect(summary.employerFee).toBe(24000);
    expect(summary.totalDue).toBe(28800);
    expect(summary.paymentMethod).toBe('bank_transfer');
  });
});
