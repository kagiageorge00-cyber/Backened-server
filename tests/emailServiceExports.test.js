const rootEmail = require('../email');
const serviceEmail = require('../services/email');

describe('email module compatibility', () => {
  test('root email module exposes sendEmail and notifyPaymentSuccess', () => {
    expect(typeof rootEmail).toBe('function');
    expect(typeof rootEmail.sendEmail).toBe('function');
    expect(typeof rootEmail.notifyPaymentSuccess).toBe('function');
  });

  test('services/email wrapper exposes the same functions', () => {
    expect(typeof serviceEmail.sendEmail).toBe('function');
    expect(typeof serviceEmail.notifyPaymentSuccess).toBe('function');
  });
});
