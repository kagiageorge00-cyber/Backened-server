# Bliss Connect Backend - API Endpoints Status Check

## ✅ Verified Working Endpoints

### 1. Health Check
- **Endpoint:** `GET https://backened-server-1.onrender.com/`
- **Status:** ✅ WORKING
- **Response:**
```json
{"success": true, "message": "Bliss Backend Running"}
```

### 2. Admin Login
- **Endpoint:** `POST https://backened-server-1.onrender.com/api/admin/login`
- **Status:** ✅ WORKING
- **Request Body:**
```json
{
  "username": "boss",
  "password": "boss123"
}
```
- **Response:**
```json
{
  "success": true,
  "token": "b2eed6d972e512e75f72ad967427ca44d5933f0fb9d730afe4a53e90a726ea07",
  "expiresIn": 3600
}
```

---

## 📋 Register Endpoint

### Path
`POST /api/register/register`

### Required Fields
```json
{
  "fullName": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "country": "string (required)",
  "skills": "string (required)",
  "experience": "string (required)",
  "photoUrl": "string (required)",
  "videoUrl": "string (required)",
  "passportUrl": "string (required)",
  "medicalUrl": "string (required)",
  "resumeUrl": "string (required)",
  "additionalUrl": "string (optional)"
}
```

### What It Does
- ✅ Validates all required fields
- ✅ Checks for duplicate phone/email
- ✅ Generates unique candidate code: `CAND-YYYY-XXXX`
- ✅ Generates temporary password in format: `BLISSXXXX` (e.g., BLISS4829)
- ✅ Hashes password with bcryptjs
- ✅ Creates candidate profile
- ✅ Sets `isVerified: true` and `paymentStatus: completed`
- ✅ Sends background emails (non-blocking)

### Example Request
```javascript
POST https://backened-server-1.onrender.com/api/register/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "country": "Kenya",
  "skills": "Hospitality, Customer Service",
  "experience": "5 years",
  "photoUrl": "https://example.com/photo.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "passportUrl": "https://example.com/passport.pdf",
  "medicalUrl": "https://example.com/medical.pdf",
  "resumeUrl": "https://example.com/resume.pdf"
}
```

### Example Response
```json
{
  "success": true,
  "message": "Candidate registered successfully",
  "candidateId": "CAND-2026-5847",
  "password": "BLISS4829",
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "uniqueCode": "CAND-2026-5847",
    "isVerified": true,
    "paymentStatus": "completed",
    "status": "available"
  }
}
```

---

## 💳 Submit Payment Endpoint

### Paths
- `POST /api/submitPayment` (legacy)
- `POST /api/submitpayments/submitPayment` (routes version)
- `POST /api/submitpayments/payments` (routes version)

### Required Fields
```json
{
  "userId": "string OR user_id OR candidateId OR candidate_id OR phone OR email",
  "amount": "number or string (required)",
  "transactionCode": "string OR transactionId OR transaction_id (required)",
  "email": "string (optional - will lookup if not provided)",
  "name": "string (optional - will lookup if not provided)",
  "paymentMethod": "string (optional - defaults to 'mpesa')",
  "phone": "string (optional - can be used as userId)"
}
```

### What It Does
- ✅ Validates userId, amount, and transactionId
- ✅ Checks for duplicate transactions
- ✅ Creates Payment record in database
- ✅ **Responds immediately** (< 100ms) with payment ID
- ✅ Sends confirmation email in background (non-blocking)
- ✅ Sets status to "pending" (waiting for verification)

### Example Request
```javascript
POST https://backened-server-1.onrender.com/api/submitpayments/submitPayment
Content-Type: application/json

{
  "candidateId": "CAND-2026-5847",
  "email": "john@example.com",
  "name": "John Doe",
  "amount": 5000,
  "transactionCode": "TXN_20260610_12345",
  "paymentMethod": "mpesa"
}
```

### Example Response
```json
{
  "success": true,
  "message": "Payment submitted successfully",
  "paymentId": "507f1f77bcf86cd799439011"
}
```

### Fallback Field Names Accepted
- `userId` → user_id → candidateId → candidate_id → phone → email
- `transactionCode` → transactionId → transaction_id
- `amount` (automatically converts string to number)

---

## ⚠️ Important Notes

### 1. Fast Response Pattern
Both register and payment endpoints use `setImmediate()` for background email sending:
- ✅ API response returns in < 100ms
- ✅ Emails sent asynchronously (non-blocking)
- ✅ No request timeouts

### 2. Registration Flow
1. User fills out form with all required documents
2. Call `/api/register/register` endpoint
3. Get back `candidateId` and temporary `password`
4. Display credentials to user once only
5. User can now login with candidateId + password

### 3. Payment Flow
1. After successful payment gateway transaction
2. Call `/api/submitpayments/submitPayment` endpoint
3. Get back `paymentId` immediately
4. Payment status set to "pending" (waiting for admin verification)
5. Admin can verify via admin dashboard

### 4. Email Configuration
- Emails are sent from: `blssspprtteam@gmail.com` (via Nodemailer)
- Resend API also configured as backup
- Both background emails are non-blocking

---

## 🔧 Frontend Integration Examples

### Register a Candidate
```javascript
const registerCandidate = async (formData) => {
  try {
    const response = await fetch('https://backened-server-1.onrender.com/api/register/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Candidate ID:', result.candidateId);
      console.log('Temporary Password:', result.password);
      // Store securely and show to user once
      return result.data;
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Submit Payment
```javascript
const submitPayment = async (paymentData) => {
  try {
    const response = await fetch('https://backened-server-1.onrender.com/api/submitpayments/submitPayment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Payment ID:', result.paymentId);
      console.log('Status: Pending verification');
      return result.paymentId;
    }
  } catch (error) {
    console.error('Payment submission failed:', error);
  }
};
```

---

## ✅ Checklist for Web App Integration

- [ ] Configure API base URL: `https://backened-server-1.onrender.com`
- [ ] Add register form with all required fields
- [ ] Capture candidateId and password after registration
- [ ] Display to user once (then remove from screen for security)
- [ ] Integrate payment gateway (Flutterwave or M-Pesa)
- [ ] After payment, call submit payment endpoint
- [ ] Show payment pending message while admin verifies
- [ ] Implement login with candidateId + password

---

## 📞 Need Help?
If endpoints are not responding:
1. Check MongoDB connection (Atlas credentials in .env)
2. Verify CORS is enabled (✅ it is)
3. Check admin dashboard for payment verification status
4. Monitor backend logs on Render dashboard
