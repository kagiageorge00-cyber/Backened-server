# WhatsApp Campaign Management - Implementation Checklist & Quick Start

## ✅ Completed Components

### Database Models
- [x] WhatsAppContact - Contact storage with validation
- [x] WhatsAppCampaign - Campaign configuration  
- [x] WhatsAppQueue - Message queue with retry logic
- [x] WhatsAppMessageLog - Complete message history
- [x] WhatsAppOptOut - Opt-out registry
- [x] WhatsAppImportHistory - Import audit trail

### Services
- [x] whatsappContactService.js - Contact CRUD and management
- [x] whatsappCampaignService.js - Campaign lifecycle
- [x] whatsappQueueService.js - BullMQ queue processing
- [x] whatsappCloudService.js (existing) - WhatsApp Cloud API

### Controllers & Routes
- [x] whatsappAdminController.js - HTTP request handlers
- [x] whatsappAdmin.js - Admin API routes
- [x] whatsappWebhook.js (enhanced) - Webhook handlers with opt-out detection

### Workers
- [x] whatsappQueueWorker.js - Standalone queue processor

### Documentation
- [x] WHATSAPP_CAMPAIGN_GUIDE.md - Comprehensive backend guide
- [x] FLUTTER_UI_STRUCTURE.md - Flutter admin UI structure

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

```bash
cd backend
npm install bullmq ioredis express-rate-limit libphonenumber-js papaparse
```

### Step 2: Configure Environment

Add to `.env`:

```env
# WhatsApp (from your setup)
WHATSAPP_PHONE_NUMBER_ID=682624514934414
WHATSAPP_WABA_ID=your_waba_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bliss
```

### Step 3: Create Required Directories

```bash
mkdir -p uploads/whatsapp-imports
mkdir -p workers
touch workers/whatsappQueueWorker.js
```

### Step 4: Register Routes in server.js

```javascript
// After existing middleware setup
const whatsappAdminRoutes = require('./routes/whatsappAdmin');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');

// Admin routes (with auth)
app.use('/api/admin/whatsapp', jwtMiddleware, adminAuthMiddleware, whatsappAdminRoutes);

// Public webhook endpoint
app.use('/api/whatsapp', whatsappWebhookRoutes);
```

### Step 5: Start Services

**Terminal 1 - Main Server:**
```bash
npm start
# or
npm run dev
```

**Terminal 2 - Redis:**
```bash
redis-server
# or
redis-cli ping  # to verify running
```

**Terminal 3 - Queue Worker:**
```bash
node workers/whatsappQueueWorker.js
```

## 📋 Testing the Implementation

### Test 1: Import Contacts

```bash
curl -X POST http://localhost:3000/api/admin/whatsapp/contacts/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@contacts.csv" \
  -F "tags=tech" \
  -F "tags=senior"
```

**CSV Format:**
```csv
full_name,phone_number,source,tags
John Doe,+254712345678,linkedin,tech;senior
Jane Smith,+254712345679,referral,hr
```

### Test 2: Get Contacts

```bash
curl -X GET "http://localhost:3000/api/admin/whatsapp/contacts?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 3: Create Campaign

```bash
curl -X POST http://localhost:3000/api/admin/whatsapp/campaigns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "message": "Hi {{name}}, we have great opportunities!",
    "audienceTags": ["tech", "senior"],
    "sendMode": "immediate"
  }'
```

### Test 4: Queue Campaign

```bash
curl -X POST http://localhost:3000/api/admin/whatsapp/campaigns/{campaignId}/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "campaignId": "...",
    "contactsQueued": 150,
    "status": "queued"
  }
}
```

### Test 5: Launch Campaign

```bash
curl -X POST http://localhost:3000/api/admin/whatsapp/campaigns/{campaignId}/launch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Watch queue worker logs - messages should start processing!

### Test 6: Webhook Verification (Manual)

```bash
# WhatsApp will send verification request
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_secure_token"

# Should return: test
```

### Test 7: Simulate Opt-Out

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "254712345678",
            "text": {"body": "STOP"},
            "timestamp": "1234567890",
            "id": "msg_123"
          }]
        }
      }]
    }]
  }'
```

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module 'bullmq'"
**Solution:** `npm install bullmq ioredis`

### Issue: "Redis connection refused"
**Solution:** 
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it
redis-server
```

### Issue: "Queue worker not processing messages"
**Solution:**
1. Verify worker is running: `node workers/whatsappQueueWorker.js`
2. Check queue has messages: MongoDB > WhatsAppQueue collection
3. Verify Redis connection in worker logs
4. Check phone numbers are in E.164 format

### Issue: "WhatsApp API Error: Invalid parameter"
**Solution:**
1. Verify WHATSAPP_ACCESS_TOKEN is correct
2. Verify WHATSAPP_PHONE_NUMBER_ID is correct
3. Check message format and length
4. Verify phone numbers include country code

### Issue: "Campaign not launching"
**Solution:**
1. Campaign must be in 'queued' status
2. Contact count must be > 0
3. Check admin logs for errors
4. Verify JWT token is valid

## 📊 Monitoring

### Check Queue Status

```bash
# Access MongoDB
mongosh
use bliss
db.whatsappqueues.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

# Output example:
# { _id: 'sent', count: 450 }
# { _id: 'pending', count: 50 }
# { _id: 'delivered', count: 430 }
```

### Check Message Logs

```bash
# Get recent failed messages
db.whatsappmessagelogs.find(
  { status: 'failed' }
).sort({ createdAt: -1 }).limit(10)
```

### Check Opt-Outs

```bash
# Get all opted-out contacts
db.whatsappoptouts.find().count()

# Get by reason
db.whatsappoptouts.aggregate([
  { $group: { _id: "$optOutReason", count: { $sum: 1 } } }
])
```

## 🔐 Security Checklist

- [ ] WhatsApp access token is in environment variables (never in code)
- [ ] JWT authentication on all admin endpoints
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] Webhook token verification enabled
- [ ] Phone numbers validated in E.164 format
- [ ] File uploads validated by type and size
- [ ] MongoDB indexes created for performance
- [ ] Redis has authentication (if exposed)
- [ ] HTTPS enabled in production
- [ ] Admin audit logging implemented

## 📈 Performance Optimization

- Queue worker processes 10 messages concurrently
- Message retry with exponential backoff
- Database indexes on all frequently queried fields
- Pagination on all list endpoints
- Redis caching for queue state
- Batch imports optimized for large CSV files

## 🚢 Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database backed up
- [ ] Redis configured for persistence
- [ ] Queue worker runs as separate service
- [ ] Monitoring/alerting set up
- [ ] Error logging configured
- [ ] SSL certificates configured
- [ ] Rate limits adjusted for expected load
- [ ] Database indexes created

### Deployment Steps

1. **Backend:**
   ```bash
   npm install --production
   npm start
   ```

2. **Queue Worker (separate process/container):**
   ```bash
   node workers/whatsappQueueWorker.js
   ```

3. **Redis:**
   - Use managed Redis (AWS ElastiCache, Azure Cache, etc.)
   - Or deploy Redis instance separately

4. **MongoDB:**
   - Use MongoDB Atlas or similar
   - Ensure backups are configured

5. **Environment:**
   - Set all variables in production environment
   - Use secrets manager for sensitive values

## 📚 Next Steps

1. **Implement Flutter UI** - Use FLUTTER_UI_STRUCTURE.md
2. **Add WhatsApp Templates** - Register templates in WhatsApp Business Platform
3. **Set up Webhook** - Point webhook to your domain
4. **Configure Monitoring** - Set up error tracking (Sentry, DataDog)
5. **Load Testing** - Test with 10k+ contacts
6. **User Documentation** - Document for admin users
7. **Backup Strategy** - Implement database backups
8. **Disaster Recovery** - Plan for failures

## 📞 Support Resources

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Mongoose Guides](https://mongoosejs.com/docs/)
- [Redis Documentation](https://redis.io/documentation)

## 🎯 Feature Roadmap

### Phase 2
- [ ] WhatsApp Template Management (register/approve templates)
- [ ] Contact Segmentation (advanced filters)
- [ ] A/B Testing for messages
- [ ] Scheduled campaigns with timezone support
- [ ] Contact engagement scoring
- [ ] Conversation history storage

### Phase 3
- [ ] WhatsApp Bot integration
- [ ] Automated responses
- [ ] Contact preferences/interests
- [ ] Integration with other channels (SMS, Email)
- [ ] Advanced analytics and reporting

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready
