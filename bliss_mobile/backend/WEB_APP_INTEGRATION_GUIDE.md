# Bliss Connect Web App - Backend Integration Guide

## 🚀 Quick Start

**Backend URL:** `https://backened-server-1.onrender.com`

All endpoints require:
- `Content-Type: application/json`
- CORS enabled (✅ configured)

---

## 📊 Complete API Reference

### 1️⃣ ADMIN LOGIN
```
POST /api/admin/login
```

**Request:**
```json
{
  "username": "boss",
  "password": "boss123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "f59795aa9e496fa5b056b33e0bafe9af0bc0a16e93bc3b914a409c87f9244b21",
  "expiresIn": 3600
}
```

**Use this token for:** Admin dashboard authentication, payment approval, candidate management

---

### 2️⃣ REGISTER CANDIDATE
```
POST /api/register/register
```

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "country": "Kenya",
  "skills": "Hospitality, Customer Service",
  "experience": "5 years",
  "photoUrl": "https://cdn.example.com/photo.jpg",
  "videoUrl": "https://cdn.example.com/video.mp4",
  "passportUrl": "https://cdn.example.com/passport.pdf",
  "medicalUrl": "https://cdn.example.com/medical.pdf",
  "resumeUrl": "https://cdn.example.com/resume.pdf",
  "additionalUrl": "https://cdn.example.com/additional.pdf"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Candidate registered successfully",
  "candidateId": "CAND-2026-5847",
  "password": "BLISS4829",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "country": "Kenya",
    "uniqueCode": "CAND-2026-5847",
    "isVerified": true,
    "paymentStatus": "completed",
    "status": "available",
    "createdAt": "2026-06-10T12:00:00Z"
  }
}
```

**Key Points:**
- ✅ All fields are **required**
- ✅ Phone must be unique
- ✅ Email must be unique
- ✅ Temporary password is generated: `BLISSXXXX`
- ✅ Display password to user **once only**
- ✅ Confirmation emails sent in background

---

### 3️⃣ SUBMIT PAYMENT
```
POST /api/submitpayments/submitPayment
```

**Request:**
```json
{
  "candidateId": "CAND-2026-5847",
  "email": "john@example.com",
  "name": "John Doe",
  "amount": 5000,
  "transactionCode": "TXN_20260610_12345",
  "paymentMethod": "mpesa",
  "phone": "254712345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment submitted successfully",
  "paymentId": "507f1f77bcf86cd799439012"
}
```

**Field Flexibility:**
- `candidateId` can be: phone, email, uniqueCode, or actual candidateId
- `transactionCode` aliases: `transactionId`, `transaction_id`
- `amount` accepts: number or string (auto-converted)
- `paymentMethod` defaults to: `"mpesa"`

**Status:**
- ✅ Response returns in < 100ms
- ✅ Payment created with `status: "pending"`
- ✅ Waiting for admin verification
- ✅ Email confirmation sent asynchronously

---

### 4️⃣ CREATE PAYMENT (Alternative)
```
POST /api/payments/payment
```

**Request:**
```json
{
  "userId": "254712345678",
  "amount": 5000,
  "paymentMethod": "mpesa",
  "email": "john@example.com",
  "name": "John Doe",
  "title": "Job Application Fee"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment initiated",
  "paymentId": "507f1f77bcf86cd799439013",
  "transactionId": "MPESA_1718018400000",
  "paymentLink": null
}
```

**Supported Payment Methods:**
- `"mpesa"` - M-Pesa (simulated in dev)
- `"card"` - Flutterwave integration (for card payments)

---

### 5️⃣ VERIFY PAYMENT
```
POST /api/payments/verify
```

**Request:**
```json
{
  "userId": "254712345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "254712345678",
    "amount": 5000,
    "status": "pending",
    "transactionId": "TXN_20260610_12345",
    "createdAt": "2026-06-10T12:00:00Z"
  }
}
```

---

### 6️⃣ VALIDATE PAYMENT
```
GET /api/payments/{paymentId}/validate
```

**Response (200):**
```json
{
  "success": true,
  "isValid": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "pending",
    "amount": 5000
  }
}
```

---

## 🛠️ Implementation Checklist

### Step 1: User Registration
- [ ] Create registration form with all required fields
- [ ] Upload documents to cloud storage (Cloudinary recommended)
- [ ] Call `/api/register/register` endpoint
- [ ] Receive `candidateId` and temporary `password`
- [ ] Display credentials to user (show once, then hide)
- [ ] Store candidateId for later use

### Step 2: Payment Processing
- [ ] Integrate payment gateway (M-Pesa or Flutterwave)
- [ ] After successful payment, get transaction code
- [ ] Call `/api/submitpayments/submitPayment` endpoint
- [ ] Display "Payment pending verification" message
- [ ] Poll `/api/payments/verify` to check status update (admin approval)

### Step 3: Admin Dashboard
- [ ] Login with `/api/admin/login` to get auth token
- [ ] View pending payments
- [ ] Approve or reject payments
- [ ] Monitor candidate registrations

---

## 💻 Sample Frontend Code

### JavaScript (Vanilla)

```javascript
// ====== REGISTER CANDIDATE ======
async function registerCandidate(formData) {
  const response = await fetch('https://backened-server-1.onrender.com/api/register/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      country: formData.country,
      skills: formData.skills,
      experience: formData.experience,
      photoUrl: formData.photoUrl,
      videoUrl: formData.videoUrl,
      passportUrl: formData.passportUrl,
      medicalUrl: formData.medicalUrl,
      resumeUrl: formData.resumeUrl,
    }),
  });

  const result = await response.json();
  if (result.success) {
    console.log('✅ Registration successful!');
    console.log('Candidate ID:', result.candidateId);
    console.log('Temporary Password:', result.password);
    return result;
  } else {
    console.error('❌ Registration failed:', result.error);
    throw new Error(result.error);
  }
}

// ====== SUBMIT PAYMENT ======
async function submitPayment(candidateId, transactionCode, amount) {
  const response = await fetch('https://backened-server-1.onrender.com/api/submitpayments/submitPayment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidateId: candidateId,
      transactionCode: transactionCode,
      amount: amount,
      paymentMethod: 'mpesa',
    }),
  });

  const result = await response.json();
  if (result.success) {
    console.log('✅ Payment submitted!');
    console.log('Payment ID:', result.paymentId);
    return result.paymentId;
  } else {
    console.error('❌ Payment failed:', result.error);
    throw new Error(result.error);
  }
}

// ====== CHECK PAYMENT STATUS ======
async function checkPaymentStatus(candidateId) {
  const response = await fetch('https://backened-server-1.onrender.com/api/payments/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: candidateId }),
  });

  const result = await response.json();
  return result.data?.status || 'unknown';
}

// ====== ADMIN LOGIN ======
async function loginAdmin(username, password) {
  const response = await fetch('https://backened-server-1.onrender.com/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  if (result.success) {
    localStorage.setItem('adminToken', result.token);
    return result.token;
  } else {
    throw new Error('Invalid credentials');
  }
}
```

### React Example

```jsx
import { useState } from 'react';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    skills: '',
    experience: '',
    photoUrl: '',
    videoUrl: '',
    passportUrl: '',
    medicalUrl: '',
    resumeUrl: '',
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://backened-server-1.onrender.com/api/register/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) =>
          setFormData({ ...formData, fullName: e.target.value })
        }
        required
      />
      {/* ... other fields ... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {result && (
        <div style={{ color: 'green' }}>
          <p>✅ Registration successful!</p>
          <p>Candidate ID: <strong>{result.candidateId}</strong></p>
          <p>Password: <strong>{result.password}</strong></p>
        </div>
      )}
    </form>
  );
}

export default RegistrationForm;
```

---

## ⚠️ Common Issues & Solutions

### Issue: "CORS error"
**Solution:** ✅ CORS is already enabled on the backend

### Issue: "Missing required fields"
**Response:** Make sure all 10 fields are provided in register request

### Issue: "Candidate already registered"
**Solution:** Phone or email already exists - check database or use different credentials

### Issue: "Transaction already exists"
**Solution:** That transactionCode was already submitted - generate a new one

### Issue: Emails not received
**Solution:** Check spam folder - emails sent from `blssspprtteam@gmail.com`

---

## 📞 Support

- **Backend Status:** https://backened-server-1.onrender.com/
- **Database:** MongoDB Atlas (Cloud)
- **Admin Credentials:** `boss` / `boss123`
- **Email Support:** blssspprtteam@gmail.com

