# WhatsApp Cloud API Integration Guide

## Overview

This guide walks you through integrating WhatsApp Cloud API into your Bliss admin panel. The integration allows you to:

- ✅ Send individual messages
- ✅ Send bulk campaigns
- ✅ Send interactive messages with buttons
- ✅ Send media (images, videos, documents, audio)
- ✅ Send templated messages
- ✅ Receive incoming messages via webhooks
- ✅ Test API connectivity

## Prerequisites

1. **Meta Business Account** - Access to https://business.facebook.com
2. **WhatsApp Business Account** - Created through Meta Business
3. **Developer Access** - https://developers.facebook.com
4. **Phone Number Verification** - A verified phone number for testing

## Setup Steps

### 1. Create WhatsApp Business App

1. Go to [Meta Developers Console](https://developers.facebook.com)
2. Click "Create App" → Select "Business" → Enter app name
3. Add "WhatsApp" product to your app
4. Complete app setup

### 2. Get Your Credentials

You'll need three environment variables:

#### WHATSAPP_PHONE_NUMBER_ID
- Go to your app dashboard
- Navigate to **WhatsApp** → **Getting Started**
- You'll see: "Business Account ID", "Phone Number ID", "Business Phone Number ID"
- Copy the **Phone Number ID** (this is your `WHATSAPP_PHONE_NUMBER_ID`)

#### WHATSAPP_WABA_ID
- In the same section, copy the **Business Account ID** (also called WABA ID)

#### WHATSAPP_ACCESS_TOKEN
- Go to **Settings** → **User & Assets** → **System Users**
- Create a new system user or use existing
- Generate or get a **long-lived access token**
- Or generate in **Apps & Websites** section

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
WHATSAPP_PHONE_NUMBER_ID=682624514934414
WHATSAPP_WABA_ID=1055066726091115
WHATSAPP_ACCESS_TOKEN=EAAcTy7Mgi90BR12vSdQxMzACZAQOTSHZA5qVQqQqqDCYO2mAvmrCDGlmDHiDWKb27ERNf92q73LseMEQ6Ei8QgjlaYZBYxo3YFWXHUERZCiZBGP8KHisedoClKHNE4IpgRbRphaCueWyfRMmdHRdIJDkiQlOYefbI4Q7mXRo6ekN5jYyVPSYJ9Jo7vTzAo7QBGvyZAOhxCTN5oxWcvB7Vu4ALyxKuLfQiPCAgu

# Optional: Custom webhook verification token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=bliss_whatsapp_verify_token
```

### 4. Set Up Webhook (Optional - For Receiving Messages)

1. Go to **App Dashboard** → **WhatsApp** → **Configuration**
2. Click "Edit" next to "Webhook"
3. Enter your webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
4. Enter verification token from `.env`
5. Subscribe to:
   - `messages`
   - `message_status` (optional)

## API Endpoints

### Admin Only Endpoints

All endpoints require: `Authorization: Bearer <admin_token>`

#### 1. Get Configuration Status
```
GET /api/admin/whatsapp/config
```

Response:
```json
{
  "success": true,
  "configured": true,
  "config": {
    "phoneNumberId": "****4414",
    "wabaId": "****1115",
    "apiVersion": "v20.0"
  }
}
```

#### 2. Send Text Message
```
POST /api/admin/whatsapp/send
```

Body:
```json
{
  "phoneNumber": "254712345678",
  "message": "Hello from Bliss Connect!",
  "type": "text"
}
```

Response:
```json
{
  "success": true,
  "messageId": "wamid.abc123...",
  "message": "WhatsApp message sent successfully"
}
```

#### 3. Send Template Message
```
POST /api/admin/whatsapp/send
```

Body:
```json
{
  "phoneNumber": "254712345678",
  "type": "template",
  "templateName": "hello_world",
  "parameters": ["John", "Welcome"]
}
```

#### 4. Send Interactive Message (Buttons)
```
POST /api/admin/whatsapp/interactive
```

Body:
```json
{
  "phoneNumber": "254712345678",
  "bodyText": "Choose your preference:",
  "buttons": [
    { "id": "btn1", "title": "Accept" },
    { "id": "btn2", "title": "Decline" },
    { "id": "btn3", "title": "More Info" }
  ],
  "footerText": "Select one option"
}
```

#### 5. Send Media Message
```
POST /api/admin/whatsapp/media
```

Body:
```json
{
  "phoneNumber": "254712345678",
  "mediaType": "image",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check out this image!"
}
```

Media types: `image`, `video`, `document`, `audio`

#### 6. Send Bulk Campaign
```
POST /api/admin/whatsapp/bulk
```

Body:
```json
{
  "recipients": ["254712345678", "254787654321", "254712345679"],
  "message": "Bulk message to all recipients",
  "delay": 1000,
  "type": "text"
}
```

Response:
```json
{
  "success": true,
  "message": "Bulk messages queued",
  "results": {
    "successful": [
      { "phoneNumber": "254712345678", "messageId": "wamid.abc..." }
    ],
    "failed": [
      { "phoneNumber": "254787654321", "error": "Invalid number" }
    ],
    "total": 3
  }
}
```

#### 7. Test Connection
```
POST /api/admin/whatsapp/test
```

Body:
```json
{
  "testPhoneNumber": "254712345678"
}
```

## Admin Panel Usage

### Access the Panel

1. Open `admin_whatsapp_panel.html` in a browser
2. Login with admin credentials (default: boss / boss123)
3. Navigate to "WhatsApp Messages" or "Bulk Campaign"

### Sending Individual Messages

1. Go to **WhatsApp Messages** tab
2. Enter recipient phone number (with country code, e.g., 254712345678)
3. Select message type
4. Enter message content
5. Click "Send Message" or "Test Connection"

### Sending Bulk Campaign

1. Go to **Bulk Campaign** tab
2. Paste phone numbers (one per line or comma-separated)
3. System will automatically count recipients
4. Enter message or select template
5. Set delay between messages (optional)
6. Click "Send Campaign"

### Message Types

#### Text
- Simple text message
- Max 4096 characters
- Supports emojis

#### Template
- Pre-approved message templates
- Must be registered with WhatsApp
- Supports variable parameters

#### Interactive (Buttons)
- Message with clickable buttons
- 1-3 buttons per message
- Button titles max 20 characters
- Optional footer text (max 60 characters)

#### Media
- Image: PNG, JPEG (max 16 MB)
- Video: MP4, 3GPP (max 16 MB)
- Document: PDF, DOC, DOCX, etc. (max 100 MB)
- Audio: MP3, OGG, WAV (max 16 MB)

## Phone Number Format

All phone numbers must include country code:

- **Kenya**: 254712345678 (not 0712345678)
- **Uganda**: 256701234567
- **Nigeria**: 234901234567
- **USA**: 12125551234

Remove any `+` prefix or spaces.

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing credentials" | Environment variables not set | Check `.env` file for all 3 variables |
| "Invalid phone number" | Wrong format or unverified number | Use format with country code, verify in sandbox |
| "Invalid access token" | Token expired or revoked | Generate new token in Meta console |
| "Template not found" | Template name doesn't exist | Register template first in WhatsApp Manager |
| "Rate limit exceeded" | Too many messages too fast | Increase delay in bulk campaigns |

## Testing

### Sandbox Mode

1. Add test phone numbers in app settings
2. Testing is free and unlimited
3. Use for development only

### Production Mode

1. Submit your app for app review
2. Request approval for required permissions
3. Production messages charged per conversation

## Code Examples

### JavaScript/Node.js

```javascript
const { 
  sendTextMessage, 
  sendBulkMessages,
  sendInteractiveMessage 
} = require('./services/whatsappCloudService');

// Send single message
await sendTextMessage('254712345678', 'Hello!');

// Send bulk
await sendBulkMessages(
  ['254712345678', '254787654321'],
  'Bulk message',
  { delay: 2000 }
);

// Send interactive
await sendInteractiveMessage(
  '254712345678',
  'Choose an option:',
  [
    { id: 'yes', title: 'Yes' },
    { id: 'no', title: 'No' }
  ]
);
```

## Monitoring & Logs

Check logs for WhatsApp activity:

```bash
# Look for WhatsApp entries
tail -f logs/app.log | grep WhatsApp
```

Log entries include:
- ✅ Message sent
- ❌ Message failed
- 📨 Incoming message
- 🔧 Configuration status

## Security Best Practices

1. **Never share access tokens** - Keep `.env` file secure
2. **Use long-lived tokens** - Less frequent rotation needed
3. **Validate phone numbers** - Verify format before sending
4. **Rate limiting** - Implement delays for bulk messages
5. **Error logging** - Monitor failures and adjust

## Troubleshooting

### Connection Test Failed

1. Check environment variables are correctly set
2. Verify access token is not expired
3. Ensure phone number ID is correct
4. Test with verified sandbox number first

### Messages Not Arriving

1. Verify recipient phone number format
2. Check number is on approved list (sandbox)
3. Wait 24 hours for production approval
4. Check WhatsApp account isn't suspended

### Admin Panel Not Loading

1. Clear browser cache
2. Check admin token is valid
3. Verify CORS settings on backend
4. Check browser console for errors

## Support

For issues:

1. Check [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
2. Review error messages in logs
3. Test with cURL first
4. Contact Meta support with app ID

## Files Modified/Created

- ✅ `services/whatsappCloudService.js` - WhatsApp API service
- ✅ `routes/admin.js` - Admin endpoints (added WhatsApp routes)
- ✅ `routes/whatsappWebhook.js` - Webhook handler
- ✅ `admin_whatsapp_panel.html` - Admin panel UI
- ✅ `server.js` - Integrated webhook routes
- ✅ `WHATSAPP_SETUP.md` - This guide

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test with admin panel
3. ✅ Create message templates
4. ✅ Set up webhooks for incoming messages
5. ✅ Monitor logs and metrics
6. ✅ Submit for production review (if needed)

---

**Last Updated**: 2026-06-27  
**API Version**: v20.0  
**Status**: ✅ Production Ready
