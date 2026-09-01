const Notification = require('../models/Notification');

describe('Notification category validation', () => {
  test('allows registration category used for candidate portal notifications', () => {
    const notification = new Notification({
      notificationId: 'NOT-REG-001',
      userId: 'candidate-123',
      title: 'Registration ready',
      message: 'Your registration can continue.',
      category: 'registration',
    });

    expect(() => notification.validateSync()).not.toThrow();
    expect(Notification.schema.path('category').enumValues).toContain('registration');
  });
});
