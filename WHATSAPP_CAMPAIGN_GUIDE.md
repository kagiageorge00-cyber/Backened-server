# WhatsApp Campaign Management System - Complete Guide

## Overview

This is a production-ready WhatsApp Campaign Management module for Bliss Connect recruitment CRM. It provides complete contact management, campaign automation, message queuing, opt-out handling, and analytics.

## Architecture

### Components

1. **Database Models**
   - `WhatsAppContact` - Contact storage with validation
   - `WhatsAppCampaign` - Campaign configuration
   - `WhatsAppQueue` - Message queue with retry logic
   - `WhatsAppMessageLog` - Complete message history
   - `WhatsAppOptOut` - Opt-out registry
   - `WhatsAppImportHistory` - Import audit trail

2. **Services**
   - `whatsappContactService.js` - Contact CRUD and management
   - `whatsappCampaignService.js` - Campaign lifecycle management
   - `whatsappQueueService.js` - BullMQ message queue processing
   - `whatsappCloudService.js` - WhatsApp Cloud API integration

3. **Controllers**
   - `whatsappAdminController.js` - HTTP request handlers

4. **Routes**
   - `/routes/whatsappAdmin.js` - Admin API endpoints
   - `/routes/whatsappWebhook.js` - Webhook handlers

5. **Workers**
   - `workers/whatsappQueueWorker.js` - Standalone queue processor

## Installation & Setup

### 1. Install Dependencies

```bash
npm install bullmq ioredis express-rate-limit libphonenumber-js papaparse
```

### 2. Environment Variables

Add to `.env`:

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=682624514934414
WHATSAPP_WABA_ID=<your_waba_id>
WHATSAPP_ACCESS_TOKEN=<your_access_token>
WHATSAPP_API_VERSION=v20.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_verify_token

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bliss
```

### 3. Redis Setup

Redis is required for message queue:

**Windows (via WSL or native):**
```bash
# Using WSL
wsl --install
wsl
sudo apt-get install redis-server
sudo service redis-server start

# Or download Redis for Windows
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### 4. Integrate Routes in Express App

In `server.js`:

```javascript
const whatsappAdminRoutes = require('./routes/whatsappAdmin');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');

// Mount routes with JWT middleware
app.use('/api/admin/whatsapp', jwtMiddleware, whatsappAdminRoutes);
app.use('/api/whatsapp', whatsappWebhookRoutes);
```

### 5. Start Queue Worker

In separate terminal:

```bash
node workers/whatsappQueueWorker.js
```

Or add to `package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "queue-worker": "node workers/whatsappQueueWorker.js",
  "dev": "concurrently \"node server.js\" \"node workers/whatsappQueueWorker.js\""
}
```

## API Reference

### Contact Management

#### Import Contacts
```http
POST /api/admin/whatsapp/contacts/import
Content-Type: multipart/form-data

Body:
- file: [CSV/XLSX file]
- tags: ["tag1", "tag2"]
- importName: "Q1 2024 Candidates"

Response:
{
  "success": true,
  "data": {
    "importId": "...",
    "total": 1000,
    "successful": 980,
    "duplicates": 15,
    "invalid": 5,
    "newContactsCreated": 950,
    "existingContactsUpdated": 30,
    "errors": [...]
  }
}
```

**CSV Format:**
```csv
full_name,phone_number,source,tags
John Doe,+254712345678,linkedin,tech;senior
Jane Smith,+254712345679,referral,hr;manager
```

#### Get Contacts
```http
GET /api/admin/whatsapp/contacts?page=1&limit=20&optedOut=false&tags=tech

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "pages": 25
  }
}
```

#### Search Contacts
```http
GET /api/admin/whatsapp/contacts?search=john

Response: Returns contacts matching "john" in name or phone
```

#### Get Contact Statistics
```http
GET /api/admin/whatsapp/contacts/statistics

Response:
{
  "success": true,
  "data": {
    "totalContacts": 5000,
    "activeContacts": 4500,
    "optedOutContacts": 500,
    "inactivePercentage": "10.00",
    "topTags": [
      { "_id": "tech", "count": 2000 },
      { "_id": "senior", "count": 1500 }
    ]
  }
}
```

#### Deduplicate Contacts
```http
POST /api/admin/whatsapp/contacts/deduplicate

Response:
{
  "success": true,
  "data": {
    "duplicatesFound": 50,
    "contactsMerged": 45,
    "tagsPreserved": 120
  }
}
```

#### Add Tags to Contacts
```http
POST /api/admin/whatsapp/contacts/add-tags

Body:
{
  "contactIds": ["id1", "id2", "id3"],
  "tags": ["newTag", "anotherTag"]
}
```

### Campaign Management

#### Create Campaign
```http
POST /api/admin/whatsapp/campaigns

Body:
{
  "name": "Q1 2024 Recruitment Drive",
  "message": "Hi {{name}}, we have exciting job opportunities for you. Reply STOP to opt out.",
  "templateName": "job_opportunity",
  "templateParameters": [],
  "audienceTags": ["tech", "senior"],
  "sendMode": "scheduled",
  "scheduledAt": "2024-01-15T10:00:00Z"
}

Response: { "success": true, "data": { "_id": "...", "status": "draft", ... } }
```

#### List Campaigns
```http
GET /api/admin/whatsapp/campaigns?page=1&limit=10&status=draft

Response:
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### Get Campaign Details
```http
GET /api/admin/whatsapp/campaigns/campaign-id

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Q1 2024 Recruitment Drive",
    "status": "draft",
    "stats": {
      "queued": 0,
      "sent": 0,
      "delivered": 0,
      "read": 0,
      "failed": 0,
      "skipped": 0
    },
    "queueStats": {...}
  }
}
```

#### Update Campaign
```http
PATCH /api/admin/whatsapp/campaigns/campaign-id

Body:
{
  "message": "Updated message",
  "audienceTags": ["tech", "junior"]
}
```

#### Queue Campaign
```http
POST /api/admin/whatsapp/campaigns/campaign-id/queue

Response:
{
  "success": true,
  "data": {
    "campaignId": "...",
    "contactsQueued": 450,
    "status": "queued"
  }
}
```

#### Launch Campaign
```http
POST /api/admin/whatsapp/campaigns/campaign-id/launch

Response:
{
  "success": true,
  "data": {
    "campaignId": "...",
    "status": "running"
  }
}
```

#### Pause Campaign
```http
POST /api/admin/whatsapp/campaigns/campaign-id/pause
```

#### Resume Campaign
```http
POST /api/admin/whatsapp/campaigns/campaign-id/resume
```

#### Delete Campaign
```http
DELETE /api/admin/whatsapp/campaigns/campaign-id
```

#### Campaign Statistics
```http
GET /api/admin/whatsapp/campaigns/campaign-id/statistics

Response:
{
  "success": true,
  "data": {
    "campaignId": "...",
    "campaignName": "Q1 2024 Recruitment Drive",
    "status": "completed",
    "queued": 0,
    "sent": 450,
    "delivered": 445,
    "read": 380,
    "failed": 5,
    "skipped": 0,
    "deliveryRate": "98.89",
    "readRate": "84.44",
    "totalContacts": 450
  }
}
```

### Analytics & Dashboard

#### Dashboard Statistics
```http
GET /api/admin/whatsapp/statistics/dashboard

Response:
{
  "success": true,
  "data": {
    "campaigns": {
      "total": 15,
      "active": 2,
      "completed": 13
    },
    "queue": {
      "pending": 100,
      "processing": 50,
      "sent": 5000,
      "delivered": 4900,
      "read": 4200,
      "failed": 50
    },
    "deliveryMetrics": {
      "totalQueued": 100,
      "totalSent": 5000,
      "totalDelivered": 4900,
      "totalRead": 4200,
      "totalFailed": 50
    }
  }
}
```

## Message Flow

### Campaign Launch Flow

```
1. Create Campaign (draft)
   ↓
2. Queue Campaign (prepare contacts)
   ↓
3. Launch Campaign (start processing)
   ↓
4. Queue Worker picks messages
   ↓
5. Send via WhatsApp Cloud API
   ↓
6. Receive status updates via webhook
   ↓
7. Update queue & log records
   ↓
8. Campaign complete
```

### Opt-Out Detection Flow

```
1. Contact replies with STOP/UNSUBSCRIBE/etc
   ↓
2. Webhook receives message
   ↓
3. Detect opt-out keyword
   ↓
4. Create OptOut record
   ↓
5. Mark Contact as optedOut=true
   ↓
6. Exclude from future campaigns
```

## Retry Logic

Failed messages use exponential backoff:

- **Retry 1:** 5 seconds
- **Retry 2:** 30 seconds  
- **Retry 3:** 5 minutes

After 3 attempts, message marked as `failed`.

## Security Considerations

✅ **Implemented:**
- Environment variable secrets (never expose tokens)
- JWT authentication on all admin endpoints
- Rate limiting on sensitive endpoints
- Phone number validation and normalization
- Input validation on all imports
- Secure file upload with type checking

✅ **Best Practices:**
- Access tokens stored server-side only
- Webhook token verification
- HTTPS in production
- MongoDB connection pooling
- Redis authentication (if used)
- Audit logging for admin actions

## Database Indexes

All models have optimized indexes for:
- Campaign queries
- Contact lookups by phone/tags
- Queue status filtering
- Timestamp sorting

## Performance Optimization

1. **Batch Processing:** Messages sent in batches of 10 concurrent
2. **Database Indexing:** Optimized queries with indexes
3. **Caching:** Redis for queue state
4. **Pagination:** All list endpoints paginated
5. **Lean Queries:** Using `.lean()` where updates not needed

## Monitoring & Logging

All operations logged to console with:
- ✅ Success indicators
- ❌ Error tracking
- 📊 Status updates
- 📨 Message details

For production, integrate with:
- CloudWatch / DataDog
- Sentry
- ELK Stack
- New Relic

## Troubleshooting

### Redis Connection Error
```
Error: Unable to connect to Redis
Solution: Ensure Redis is running on port 6379
```

### WhatsApp API Errors
```
Error: "Invalid message type"
Solution: Check API version and message format
```

### MongoDB Connection
```
Error: ECONNREFUSED
Solution: Ensure MongoDB is running and URI is correct
```

### Messages Not Sending
```
1. Check queue worker is running
2. Verify environment variables
3. Check phone numbers are in E.164 format
4. Review queue records in database
5. Check WhatsApp Business Account status
```

## Next Steps

1. Test with small campaign (10 contacts)
2. Monitor webhook delivery
3. Check queue processing logs
4. Verify opt-out detection
5. Test error scenarios
6. Set up production monitoring
7. Configure backups
8. Document custom workflows

## Support

For issues:
1. Check logs in console
2. Review database records
3. Verify environment variables
4. Test webhook endpoint
5. Check Redis connection
6. Review rate limits
