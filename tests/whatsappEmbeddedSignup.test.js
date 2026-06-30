const router = require('../routes/whatsappEmbeddedSignup');

describe('whatsapp embedded signup helpers', () => {
  test('parses the signed request payload from embedded signup callback data', () => {
    const originalPayload = { data: { whatsapp_business_account: { id: 'waba_123', phone_number_id: 'pn_456' } } };
    const encodedPayload = Buffer.from(JSON.stringify(originalPayload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const signedRequest = `signature.${encodedPayload}`;

    const helpers = router.__testHelpers;
    expect(helpers).toBeDefined();
    expect(helpers.parseSignedRequest(signedRequest)).toEqual(originalPayload);
  });

  test('extracts WhatsApp account and phone number IDs from the signup payload', () => {
    const payload = {
      data: {
        whatsapp_business_account: {
          id: 'waba_789',
          phone_number_id: 'pn_999',
          display_name: 'Bliss WhatsApp',
        },
      },
    };

    const helpers = router.__testHelpers;
    const extracted = helpers.extractEmbeddedSignupAssets(payload, {});

    expect(extracted.wabaId).toBe('waba_789');
    expect(extracted.phoneNumberId).toBe('pn_999');
    expect(extracted.businessName).toBe('Bliss WhatsApp');
  });
});
