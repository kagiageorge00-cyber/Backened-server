# WhatsApp Campaign Management - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                               │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │   Flutter Admin UI  │  │    Web Admin Dashboard           │ │
│  │  • Contact List     │  │  • Campaign Builder              │ │
│  │  • Import CSV       │  │  • Analytics Dashboard           │ │
│  │  • Campaigns        │  │  • Settings                      │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
└────────────────┬──────────────────────┬───────────────────────┘
                 │                      │
        JWT Token │                      │ JWT Token
                 ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                   API GATEWAY & AUTH                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Express.js Middleware                                     │  │
│  │  • JWT Verification  • Admin Auth  • Rate Limiting        │  │
│  │  • CORS Protection   • Request Logging                    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────┬─────────────────────────┘
           │                          │
    Public Webhook                 Admin Routes
           │                          │
           ▼                          ▼
┌────────────────────────┐   ┌────────────────────────────┐
│  WEBHOOK HANDLER       │   │  ADMIN CONTROLLER          │
│  /api/whatsapp/webhook │   │  /api/admin/whatsapp       │
│                        │   │                            │
│ • Verify Token         │   │ • importContacts()         │
│ • Parse Events         │   │ • getContacts()            │
│ • Detect Opt-outs      │   │ • createCampaign()         │
│ • Update Status        │   │ • queueCampaign()          │
│ • Store Messages       │   │ • launchCampaign()         │
└────────────┬───────────┘   │ • getCampaignStats()       │
             │               │ • getDashboard()           │
             │               └────────────┬────────────────┘
             │                            │
             └────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────────────┐
           │       SERVICE LAYER                  │
           │                                      │
           │ ┌────────────────────────────────┐  │
           │ │ whatsappContactService         │  │
           │ │ • validatePhoneNumber()        │  │
           │ │ • bulkImportContacts()         │  │
           │ │ • removeDuplicates()           │  │
           │ │ • getContactsByTags()          │  │
           │ │ • markAsOptedOut()             │  │
           │ │ • getContactStatistics()       │  │
           │ └────────────────────────────────┘  │
           │                                      │
           │ ┌────────────────────────────────┐  │
           │ │ whatsappCampaignService        │  │
           │ │ • createCampaign()             │  │
           │ │ • queueCampaign()              │  │
           │ │ • launchCampaign()             │  │
           │ │ • getCampaignStatistics()      │  │
           │ │ • getDashboardStatistics()     │  │
           │ └────────────────────────────────┘  │
           │                                      │
           │ ┌────────────────────────────────┐  │
           │ │ whatsappQueueService (BullMQ)  │  │
           │ │ • messageQueue (Redis)         │  │
           │ │ • messageWorker                │  │
           │ │ • processQueue()               │  │
           │ │ • batchProcessCampaign()       │  │
           │ │ • retryFailedMessages()        │  │
           │ └────────────────────────────────┘  │
           │                                      │
           │ ┌────────────────────────────────┐  │
           │ │ whatsappCloudService (existing)│  │
           │ │ • sendTextMessage()            │  │
           │ │ • sendTemplateMessage()        │  │
           │ │ • sendMediaMessage()           │  │
           │ └────────────────────────────────┘  │
           └──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌──────────┐    ┌─────────┐    ┌──────────────┐
    │ MongoDB  │    │ Redis   │    │ WhatsApp API │
    │          │    │         │    │              │
    │ Models:  │    │ Queue   │    │ POST .../    │
    │ Contact  │    │ State   │    │ messages     │
    │ Campaign │    │ Cache   │    │              │
    │ Queue    │    │         │    │ Webhooks ◄─┐ │
    │ OptOut   │    │ Retry   │    │            │ │
    │ Logs     │    │ Logic   │    │ ┌──────────┘ │
    │ History  │    │         │    │ │            │
    └──────────┘    └─────────┘    └──────────────┘
                                         ▲
                                         │
                                    External
                                   WhatsApp
                                   Messages
```

## Data Flow - Campaign Launch

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMPAIGN LAUNCH                          │
└─────────────────────────────────────────────────────────────────┘

1. CREATION
   Admin UI → API → Controller → Service
   ↓
   Creates WhatsAppCampaign (status: draft)
   ↓

2. QUEUING
   API: POST /campaigns/:id/queue
   ↓
   Service: queueCampaign()
   │
   ├─ Query WhatsAppContact by audienceTags
   ├─ Filter out optedOut contacts
   ├─ Create WhatsAppQueue entries (status: pending)
   └─ Update Campaign (status: queued)
   ↓

3. LAUNCHING
   API: POST /campaigns/:id/launch
   ↓
   Service: launchCampaign()
   │
   ├─ Update Campaign (status: running)
   ├─ Notify Redis: campaign:id:launch = 1
   └─ Return to frontend
   ↓

4. QUEUE WORKER PROCESSING
   Worker: processQueue() [runs every 5 seconds]
   ↓
   ├─ Find WhatsAppQueue (status: pending, nextRetryAt ≤ now)
   ├─ Add BullMQ jobs for each message
   └─ Update status: processing
   ↓

5. MESSAGE SENDING
   BullMQ Worker (concurrency: 10)
   ↓
   For each job:
   ├─ Get queue record
   ├─ Check if contact opted out
   ├─ Send via WhatsApp Cloud API
   │  └─ POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
   ├─ Update WhatsAppQueue (status: sent, sentAt: now)
   ├─ Log to WhatsAppMessageLog (status: sent)
   └─ Return success/error
   ↓

6. WEBHOOK STATUS UPDATES
   WhatsApp → Webhook
   ↓
   Webhook Handler receives:
   ├─ Message delivered → Update Queue (delivered)
   ├─ Message read → Update Queue (read)
   └─ Incoming message → Detect opt-out keywords
      │
      └─ If opt-out detected:
         ├─ Create WhatsAppOptOut record
         ├─ Update WhatsAppContact (optedOut: true)
         └─ Skip future campaigns
   ↓

7. COMPLETION
   Dashboard polls statistics
   ├─ Aggregate WhatsAppQueue by status
   ├─ Calculate delivery/read rates
   └─ Display in dashboard
```

## Message Retry Flow

```
┌──────────────────────────────────────────────────────────┐
│                    RETRY LOGIC                           │
└──────────────────────────────────────────────────────────┘

Send Message
    ↓
Try to send via WhatsApp API
    │
    ├─ SUCCESS ──→ status: sent ──→ DONE
    │
    └─ FAILURE ──→ Error handling
                   ↓
           Check retryCount
           ↓
   ┌───────┴───────┬───────────────┐
   │               │               │
retryCount=0   retryCount=1   retryCount=2
(1st try)      (2nd try)      (3rd try)
   │               │               │
   └─ Wait 5s ─────└─ Wait 30s ────└─ Wait 5min
       │               │               │
       ↓               ↓               ↓
   Retry         Retry          Retry
       │               │               │
       └─ Update Queue ┘               │
          nextRetryAt = now + delay    │
          status: pending              │
          retryCount++                 │
          lastError: message           │
                    ↓
              Next poll (5s)
              Will pick up and retry
                    │
                    ├─ SUCCESS → status: sent
                    │
                    └─ FAILURE (3rd attempt)
                        ↓
                    status: failed
                    lastError: message
                    failedAt: now

After 3 failed attempts:
├─ Update WhatsAppQueue (status: failed)
├─ Log to WhatsAppMessageLog (status: failed)
├─ Alert admin
└─ Update campaign stats
```

## Opt-Out Detection Flow

```
┌─────────────────────────────────────────────┐
│        OPT-OUT DETECTION                    │
└─────────────────────────────────────────────┘

Customer receives message
    ↓
Customer replies with opt-out keyword:
├─ STOP
├─ UNSUBSCRIBE
├─ REMOVE
├─ OPT OUT
└─ NO JOBS
    ↓
Webhook receives incoming message
    ↓
Webhook Handler:
├─ Parse message text
├─ Check for opt-out keywords
│  (case-insensitive search)
│  ↓
│  ├─ NOT FOUND → Normal message
│  │  └─ Log to WhatsAppMessageLog
│  │
│  └─ FOUND → Opt-out detected!
│     ├─ Extract reason (STOP, UNSUBSCRIBE, etc)
│     │
│     ├─ Create WhatsAppOptOut record:
│     │  {
│     │    phoneNumber: "+254712345678",
│     │    optOutReason: "STOP",
│     │    optOutMessage: "STOP",
│     │    optedOutAt: now
│     │  }
│     │
│     ├─ Update WhatsAppContact:
│     │  {
│     │    optedOut: true,
│     │    optedIn: false
│     │  }
│     │
│     ├─ Log to WhatsAppMessageLog:
│     │  {
│     │    status: "opted_out",
│     │    eventType: "opt_out_detection"
│     │  }
│     │
│     └─ Alert admin
        ↓
        Contact now excluded from all future campaigns
        ↓
        When queueing campaigns:
        Filter out where optedOut = true
        ↓
        Prevents sending to opted-out contacts
```

## Database Relations

```
WhatsAppContact
    │
    ├─ 1 ─── Many ─→ WhatsAppQueue
    │
    ├─ 1 ─── Many ─→ WhatsAppMessageLog
    │
    └─ 1 ─── 0/1 ─→ WhatsAppOptOut


WhatsAppCampaign
    │
    ├─ 1 ─── Many ─→ WhatsAppQueue
    │
    ├─ 1 ─── Many ─→ WhatsAppMessageLog
    │
    └─ 1 ─── Many ─→ WhatsAppOptOut


WhatsAppQueue
    │
    ├─ Many ─→ 1 ─ WhatsAppCampaign
    │
    ├─ Many ─→ 1 ─ WhatsAppContact
    │
    └─ 1 ─── Many ─→ WhatsAppMessageLog (via phone)


WhatsAppImportHistory
    └─ Records bulk import operations
```

## Rate Limiting Strategy

```
┌────────────────────────────────────────┐
│      RATE LIMITING CONFIGURATION       │
└────────────────────────────────────────┘

Import Endpoint:
  Limit: 5 requests per minute
  Why: Prevent abuse, resource intensive
  Action: Return 429 Too Many Requests

Campaign Operations:
  Limit: 10 requests per minute
  Why: Prevent spam campaigns
  Action: Return 429 Too Many Requests

Contact Operations:
  Limit: 20 requests per minute
  Why: Moderate protection
  Action: Return 429 Too Many Requests

Admin Endpoints (general):
  Limit: 100 requests per minute
  Why: Normal operation protection
  Action: Return 429 Too Many Requests

Per request:
  ├─ Check current rate
  ├─ If exceeded → Return 429
  └─ Else → Allow + increment counter (resets after window)
```

## Error Handling Flow

```
┌────────────────────────────────────────┐
│      ERROR HANDLING STRATEGY           │
└────────────────────────────────────────┘

API Request
    ↓
Try-Catch Block
    │
    ├─ Input Validation Error
    │  └─ 400 Bad Request
    │     └─ Return validation message
    │
    ├─ Authentication Error
    │  └─ 401 Unauthorized
    │     └─ Missing/invalid JWT
    │
    ├─ Authorization Error
    │  └─ 403 Forbidden
    │     └─ Not admin
    │
    ├─ Resource Not Found
    │  └─ 404 Not Found
    │
    ├─ Business Logic Error
    │  └─ 400 Bad Request
    │     └─ Campaign in wrong status, etc
    │
    ├─ Rate Limit Exceeded
    │  └─ 429 Too Many Requests
    │
    ├─ WhatsApp API Error
    │  └─ 500+ status
    │     └─ Retry with backoff
    │
    ├─ Database Error
    │  └─ 500 Internal Server Error
    │     └─ Log error, alert admin
    │
    └─ Unexpected Error
       └─ 500 Internal Server Error
          └─ Log stack trace

Response Format:
{
  "success": false,
  "error": "Human readable error message"
}
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                         │
└─────────────────────────────────────────────────────────────┘

Load Balancer (Nginx/AWS ALB)
    │
    ├─ /api/whatsapp/webhook ──→ Server Cluster
    │  (can be load balanced)
    │
    └─ /api/admin/whatsapp ────→ Server Cluster
       (sticky session for admin operations)
       │
       ├─ Server 1 (Express)
       ├─ Server 2 (Express)
       └─ Server 3 (Express)
           │
           ├─ Shared MongoDB Atlas
           ├─ Shared Redis Cloud
           └─ Shared WhatsApp Account
               │
               └─ Queue Workers (separate container/VM)
                  ├─ Worker 1
                  ├─ Worker 2
                  └─ Worker 3
                     │
                     All connect to shared Redis
                     and process from same queue

Benefits:
✓ Server horizontal scaling
✓ Worker independent scaling
✓ Shared state (Redis)
✓ Persistent data (MongoDB)
✓ High availability
```

## Monitoring Points

```
┌────────────────────────────────────────┐
│         MONITORING & ALERTS            │
└────────────────────────────────────────┘

Queue Health:
├─ Pending messages count (should decrease)
├─ Processing messages count (should cycle)
├─ Failed messages count (alert if > 0)
└─ Average processing time

Campaign Performance:
├─ Delivery rate (target: > 90%)
├─ Read rate (target: > 50%)
├─ Error rate (target: < 1%)
└─ Processing time (target: < 100ms per msg)

System Health:
├─ Redis connection status
├─ MongoDB connection status
├─ Worker uptime
├─ Memory usage
├─ CPU usage
└─ API response times

Opt-Out Tracking:
├─ Opt-out rate
├─ Opt-out reasons distribution
└─ Compliance

Alerts (when):
├─ Queue processing stalls (> 5min)
├─ Error rate spikes (> 5%)
├─ Worker crashes
├─ API response > 1s
└─ Database connection fails
```

---

This architecture supports:
- ✅ Horizontal scaling
- ✅ High throughput (600+ msgs/min)
- ✅ Fault tolerance
- ✅ Real-time status updates
- ✅ Automatic retry & recovery
- ✅ Comprehensive logging
- ✅ Rate limiting
- ✅ Opt-out compliance
