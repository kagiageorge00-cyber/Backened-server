# WhatsApp Campaign Management - Quick Reference Card

## 🚀 30-Second Setup

```bash
# 1. Install dependencies
npm install bullmq ioredis express-rate-limit libphonenumber-js papaparse

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Add to server.js
const whatsappAdminRoutes = require('./routes/whatsappAdmin');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');
app.use('/api/admin/whatsapp', jwtAuth, adminAuth, whatsappAdminRoutes);
app.use('/api/whatsapp', whatsappWebhookRoutes);

# 4. Start services
npm start                           # Terminal 1
redis-server                        # Terminal 2
node workers/whatsappQueueWorker.js # Terminal 3
```

## 📡 Essential API Endpoints

### Contact Operations
```
POST   /api/admin/whatsapp/contacts/import          # Upload CSV
GET    /api/admin/whatsapp/contacts                 # List contacts
GET    /api/admin/whatsapp/contacts/statistics      # Contact stats
```

### Campaign Operations  
```
POST   /api/admin/whatsapp/campaigns                # Create
GET    /api/admin/whatsapp/campaigns                # List
POST   /api/admin/whatsapp/campaigns/:id/queue      # Queue
POST   /api/admin/whatsapp/campaigns/:id/launch     # Send
POST   /api/admin/whatsapp/campaigns/:id/pause      # Pause
GET    /api/admin/whatsapp/campaigns/:id/statistics # Stats
```

### Dashboard
```
GET    /api/admin/whatsapp/statistics/dashboard     # Stats
```

### Webhooks (No Auth)
```
GET    /api/whatsapp/webhook                        # Verify
POST   /api/whatsapp/webhook                        # Receive events
```

## 🔑 Environment Variables Required

```env
WHATSAPP_PHONE_NUMBER_ID=682624514934414
WHATSAPP_WABA_ID=your_waba_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
REDIS_HOST=localhost
REDIS_PORT=6379
MONGODB_URI=mongodb://localhost:27017/bliss
JWT_SECRET=your_jwt_secret
```

## 📊 Database Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| WhatsAppContact | Store contacts | phoneNumber, tags, optedOut |
| WhatsAppCampaign | Campaign config | name, message, status, stats |
| WhatsAppQueue | Message queue | status, phoneNumber, retryCount |
| WhatsAppOptOut | Opt-out registry | phoneNumber, reason, optedOutAt |
| WhatsAppMessageLog | Message history | status, phoneNumber, direction |
| WhatsAppImportHistory | Import tracking | status, totalRecords, errors |

## 🔄 Campaign Workflow

```
1. Create Campaign (draft)
   ↓
2. Queue Campaign (select audience by tags)
   ↓
3. Launch Campaign (start sending)
   ↓
4. Queue Worker sends messages (10 concurrent)
   ↓
5. Webhooks receive status updates
   ↓
6. Dashboard shows statistics
```

## ⚡ Message States

```
pending     → Message in queue, not sent yet
processing  → Currently being sent
sent        → Successfully sent to API
delivered   → Message reached phone
read        → Message opened by recipient
failed      → Max retries exceeded
skipped     → Contact opted out
```

## 🔁 Retry Logic

| Attempt | Wait Time | Status |
|---------|-----------|--------|
| 1st try | Send now | pending |
| Fails | Wait 5s | pending |
| 2nd try | Send | pending |
| Fails | Wait 30s | pending |
| 3rd try | Send | pending |
| Fails | Wait 5m | pending |
| 3rd attempt fails | Mark failed | failed |

## ✋ Opt-Out Keywords (Auto-Detected)

- STOP
- UNSUBSCRIBE
- REMOVE
- OPT OUT
- NO JOBS

Contact automatically excluded from future campaigns when detected.

## 📈 Important Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Delivery Rate | >90% | % of sent messages delivered |
| Read Rate | >50% | % of delivered messages read |
| Error Rate | <1% | % of failed messages |
| Queue Processing | 600 msg/min | With 10 concurrent workers |
| Response Time | <200ms | API endpoint response |

## 🔐 Security Checklist

```
✅ JWT authentication on admin endpoints
✅ Admin role verification
✅ Rate limiting (5-20 req/min)
✅ Phone number validation (E.164 format)
✅ File upload validation (type & size)
✅ Environment variable secrets
✅ Webhook token verification
✅ Input validation/sanitization
```

## 🧪 Quick Tests

```bash
# 1. Test webhook verification
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=TEST123"
# Should return: TEST123

# 2. Import contacts
curl -X POST http://localhost:3000/api/admin/whatsapp/contacts/import \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@contacts.csv"

# 3. Get contacts
curl -X GET http://localhost:3000/api/admin/whatsapp/contacts \
  -H "Authorization: Bearer YOUR_JWT"

# 4. Get dashboard stats
curl -X GET http://localhost:3000/api/admin/whatsapp/statistics/dashboard \
  -H "Authorization: Bearer YOUR_JWT"
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Redis connection error | Check: `redis-cli ping` should return PONG |
| Queue not processing | Verify: Queue worker running, Redis connection OK |
| Messages not sending | Check: Phone numbers in E.164 format, token valid |
| Webhook not receiving | Verify: Correct URL, token matches, HTTPS in production |
| Rate limit errors | Wait before retrying, check concurrency settings |

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| IMPLEMENTATION_QUICKSTART.md | Setup guide | 15 min |
| WHATSAPP_CAMPAIGN_GUIDE.md | API reference | 30 min |
| SYSTEM_ARCHITECTURE.md | System design | 20 min |
| FLUTTER_UI_STRUCTURE.md | Frontend guide | 40 min |
| SERVER_INTEGRATION_GUIDE.js | Integration | 15 min |

## 🎯 Common Operations

### Import Contacts
```
1. Create CSV with: full_name, phone_number, tags
2. POST /contacts/import with file
3. Monitor import history
```

### Create & Send Campaign
```
1. POST /campaigns (create draft)
2. POST /campaigns/:id/queue (select audience)
3. POST /campaigns/:id/launch (start sending)
4. Monitor with GET /campaigns/:id/statistics
```

### Monitor Opt-Outs
```
1. Check incoming messages via webhook
2. Automatic opt-out detection on keywords
3. View opted-out contacts in contact list
```

## 💾 Data Retention

| Entity | Retention | Notes |
|--------|-----------|-------|
| Messages | Indefinite | Full history in MessageLog |
| Queue | 7 days | After delivery |
| Contacts | Indefinite | Unless manually deleted |
| OptOuts | Indefinite | Compliance requirement |
| Imports | 90 days | Audit trail |

## 🚢 Production Deployment

```
1. Use managed MongoDB Atlas / Redis Cloud
2. Deploy queue worker as separate container
3. Set up CI/CD for deployments
4. Configure error monitoring (Sentry)
5. Set up alerts for:
   - Queue failures
   - Error rate spikes
   - API response times
6. Enable database backups
7. Use HTTPS everywhere
8. Configure log aggregation
```

## 📞 Support Resources

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [BullMQ Docs](https://docs.bullmq.io/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Redis Docs](https://redis.io/documentation)

## 🎓 Learning Path

**Day 1:** Understanding
- Read WHATSAPP_SYSTEM_SUMMARY.md
- Study SYSTEM_ARCHITECTURE.md

**Day 2:** Backend Setup
- Follow IMPLEMENTATION_QUICKSTART.md
- Reference WHATSAPP_CAMPAIGN_GUIDE.md

**Day 3:** Integration
- Use SERVER_INTEGRATION_GUIDE.js
- Test all endpoints

**Day 4:** Frontend (Optional)
- Read FLUTTER_UI_STRUCTURE.md
- Start Flutter implementation

## ⚙️ Configuration Parameters

```javascript
// Queue
QUEUE_WORKER_CONCURRENCY = 10        // Messages sent concurrently
MESSAGE_RETRY_MAX = 3                // Max retry attempts
MESSAGE_RETRY_DELAYS = [5s, 30s, 5m] // Exponential backoff

// Rate Limiting  
IMPORT_LIMIT = 5 req/min
CAMPAIGN_LIMIT = 10 req/min
ADMIN_LIMIT = 20 req/min

// File Upload
MAX_FILE_SIZE = 50MB
ALLOWED_TYPES = CSV, XLSX

// Queue Processing
PROCESS_INTERVAL = 5000ms           // Check queue every 5s
BATCH_SIZE = 100                    // Process 100 at a time
```

## 🔗 Route Hierarchy

```
/api/
├── /admin/ (requires JWT + admin role)
│   └── /whatsapp/
│       ├── /contacts/
│       │   ├── /import (POST, multipart)
│       │   ├─ (GET, paginated)
│       │   ├── /statistics (GET)
│       │   ├── /deduplicate (POST)
│       │   └── /add-tags (POST)
│       ├── /campaigns/
│       │   ├─ (POST, CREATE)
│       │   ├─ (GET, LIST)
│       │   ├── /:id (GET, PATCH, DELETE)
│       │   ├── /:id/queue (POST)
│       │   ├── /:id/launch (POST)
│       │   ├── /:id/pause (POST)
│       │   ├── /:id/resume (POST)
│       │   └── /:id/statistics (GET)
│       └── /statistics/
│           └── /dashboard (GET)
│
└── /whatsapp/ (public, no auth)
    └── /webhook
        ├─ (GET, verify)
        └─ (POST, receive events)
```

---

**Print this card for quick reference during development!**

Version 1.0.0 | Last Updated: 2024
