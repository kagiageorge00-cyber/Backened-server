WhatsApp Embedded Signup Service

Place this service under your backend and run it as a small Node/Express app that handles saving connected WhatsApp Business Accounts and receiving webhooks.

Steps:
1. Copy `config/.env.example` to `.env` and fill in values (`META_APP_SECRET`, `ENCRYPTION_KEY`, `MONGO_URI`).
2. Install deps: `npm install` in this folder.
3. Start: `npm start` (or `npm run dev`).
4. Expose `http://your-server/api/whatsapp/webhook` as the webhook URL in Meta App Dashboard and set verify token to `WHATSAPP_VERIFY_TOKEN`.

Endpoints:
- POST /api/whatsapp/exchange_token { accessToken }
- POST /api/whatsapp/save_connection { businessId, wabaId, phoneNumberId, accessToken, displayName, phoneNumber }
- GET/POST /api/whatsapp/webhook
