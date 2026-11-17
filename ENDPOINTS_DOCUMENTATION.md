# Backend Notification & Audit Endpoints - API Documentation

## Summary
Three new backend endpoints successfully deployed and tested on Render:
- POST /api/notifications/send (multi-channel notification delivery)
- POST /api/logs/registration (registration event auditing)
- POST /api/logs/admin-actions (admin action auditing)

Successful requests return structured JSON responses. Notification sending requires staff authentication; unauthenticated and non-staff callers are rejected.

---

## 1. POST /api/notifications/send

**Purpose:** Send notifications across multiple channels (email, WhatsApp, push, web)

**Base URL:** `https://backened-server-1.onrender.com/api/notifications/send`

**Authorization:** Requires `Authorization: Bearer <staff-access-token>`. Configure `JWT_SECRET` with a strong secret; staff notification actions fail closed if it is missing. Do not call this endpoint directly from an unauthenticated or public client.

**Request Body:**
```json
{
  "email": "recipient@example.com",
  "phoneNumber": "+254708715024",
  "recipientEmail": "recipient@example.com",
  "name": "Recipient Name",
  "title": "Notification Title",
  "subject": "Email Subject (optional)",
  "body": "Notification message content",
  "message": "Alternative message field",
  "candidateName": "Candidate Name (optional)",
  "candidateId": "candidate-id-123",
  "data": {
    "customKey": "customValue",
    "portalLoginLink": "https://...",
    "uploadDocumentsLink": "https://..."
  }
}
```

**Request Timeout:** 120 seconds (endpoint takes 60-120s due to sequential API calls)

**Response (Success):**
```json
{
  "success": true,
  "notificationId": "NOT-1786830006176-4289",
  "channels": {
    "email": {
      "success": true
    },
    "whatsapp": {
      "success": true
    },
    "push": {
      "success": true,
      "sent": 0
    },
    "web": {
      "success": true,
      "notificationId": "NOT-1786830006176-4289"
    }
  },
  "data": {
    "title": "Notification Title",
    "message": "Notification message content",
    "notificationType": "notification",
    "entityId": "entity-uuid",
    "customKey": "customValue"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what failed"
}
```

**Key Notes:**
- **Email field:** Accepts either `email` or `recipientEmail` (both work)
- **Phone field:** MUST use `phoneNumber` (NOT `phone`)
- **Channels:** Email and WhatsApp are optional; endpoint sends to available channels
- **Payload normalization:** Endpoint normalizes different field names to a standard schema
- **Performance:** Slow response time is normal (email SMTP + WhatsApp API delays)

---

## 2. POST /api/logs/registration

**Purpose:** Log registration workflow events for audit trail

**Base URL:** `https://backened-server-1.onrender.com/api/logs/registration`

**Request Body:**
```json
{
  "candidateId": "candidate-id-123",
  "eventType": "credential_generated",
  "details": {
    "credentialId": "cred-456",
    "credentialType": "professional_certificate",
    "customField": "customValue"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "eventId": "REG-c3ca8c4b-45b1-4a8d-bf6e-dfa00503fadd",
  "candidateId": "candidate-id-123",
  "eventType": "credential_generated",
  "data": {
    "id": "REG-c3ca8c4b-45b1-4a8d-bf6e-dfa00503fadd",
    "candidateId": "candidate-id-123",
    "eventType": "credential_generated",
    "details": {
      "credentialId": "cred-456",
      "credentialType": "professional_certificate",
      "meta": {
        "ip": "102.0.16.208, 172.69.174.182, 10.28.218.4",
        "userAgent": "Mozilla/5.0 (...)",
        "timestamp": "2026-08-15T21:44:24.286Z"
      }
    },
    "_id": "6a80ddb88c10922c3869c7ce",
    "createdAt": "2026-08-15T21:44:24.287Z",
    "updatedAt": "2026-08-15T21:44:24.287Z"
  }
}
```

**Common Event Types:**
- `credential_generated` - Document/credential uploaded
- `registration_started` - Candidate begins registration
- `registration_completed` - Candidate finishes registration
- `profile_updated` - Candidate updates profile
- `document_verified` - Admin verifies document

---

## 3. POST /api/logs/admin-actions

**Purpose:** Log admin approval/rejection actions for audit trail

**Base URL:** `https://backened-server-1.onrender.com/api/logs/admin-actions`

**Request Body:**
```json
{
  "adminId": "admin-user-id",
  "action": "payment_approved",
  "candidateId": "candidate-id-123",
  "details": {
    "paymentAmount": 50000,
    "paymentStatus": "approved",
    "reason": "All documents verified",
    "customField": "customValue"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "auditId": "AUD-7fe14235-8808-41d2-98a1-b2cce11dbd71",
  "adminId": "admin-789",
  "action": "payment_approved",
  "data": {
    "id": "AUD-7fe14235-8808-41d2-98a1-b2cce11dbd71",
    "adminId": "admin-789",
    "action": "payment_approved",
    "candidateId": "candidate-id-123",
    "details": {
      "paymentAmount": 50000,
      "paymentStatus": "approved",
      "meta": {
        "ip": "102.0.16.208, 172.69.174.182, 10.27.9.129",
        "userAgent": "Mozilla/5.0 (...)",
        "timestamp": "2026-08-15T21:45:07.824Z"
      }
    },
    "_id": "6a80dde38c10922c3869c7cf",
    "createdAt": "2026-08-15T21:45:07.824Z",
    "updatedAt": "2026-08-15T21:45:07.824Z"
  }
}
```

**Common Actions:**
- `payment_approved` - Admin approves payment
- `payment_rejected` - Admin rejects payment
- `document_verified` - Admin verifies document
- `candidate_rejected` - Admin rejects candidate
- `candidate_approved` - Admin approves candidate

---

## Testing

**Test Notification Endpoint:**
```powershell
$json = @{
    email = "kagiageorge00@gmail.com"
    phoneNumber = "+254708715024"
    title = "Test"
    body = "Test message"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://backened-server-1.onrender.com/api/notifications/send" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $env:STAFF_ACCESS_TOKEN" } `
    -ContentType "application/json" `
    -Body $json `
    -TimeoutSec 120 | Select-Object -Property StatusCode, Content
```

**Test Registration Log Endpoint:**
```powershell
$json = @{
    candidateId = "test-123"
    eventType = "registration_completed"
    details = @{ timestamp = "now" }
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://backened-server-1.onrender.com/api/logs/registration" `
    -Method POST `
    -ContentType "application/json" `
    -Body $json `
    -TimeoutSec 30 | Select-Object -Property StatusCode
```

**Test Admin Action Log Endpoint:**
```powershell
$json = @{
    adminId = "admin-123"
    action = "payment_approved"
    candidateId = "candidate-123"
    details = @{ amount = 5000 }
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://backened-server-1.onrender.com/api/logs/admin-actions" `
    -Method POST `
    -ContentType "application/json" `
    -Body $json `
    -TimeoutSec 30 | Select-Object -Property StatusCode
```

---

## Integration Steps

### For Candidate Registration Flow (Flutter)
1. When candidate completes registration:
   - Call POST /api/logs/registration with eventType="registration_completed"
   - Trigger notification delivery from a trusted backend workflow; do not call the staff-only notification endpoint directly from the public Flutter client

2. When credentials are uploaded:
   - Call POST /api/logs/registration with eventType="credential_generated"
   - Send verification instructions from a trusted backend workflow or an authenticated staff action

### For Payment Approval Flow (Admin Panel)
1. When admin approves payment:
   - Call POST /api/logs/admin-actions with action="payment_approved"
   - Have the trusted backend workflow send the notification, or use an authenticated staff action

2. When admin rejects payment:
   - Call POST /api/logs/admin-actions with action="payment_rejected"
   - Have the trusted backend workflow send the notification, or use an authenticated staff action

---

## Status: ✅ PRODUCTION READY

- All endpoints tested and working on live Render deployment
- Email delivery: ✓ Confirmed
- WhatsApp delivery: ✓ Confirmed
- Database persistence: ✓ Confirmed
- Metadata capture: ✓ Confirmed (IP, userAgent, timestamp)

Next: Integrate into Flutter frontend screens
