# Frontend Integration Guide - Bliss Connect Payment & Candidate Form

## Quick Start Integration

### 1. After Payment Success - Redirect to Form

**Frontend Payment Success Handler:**
```javascript
// After payment is approved/verified
async function handlePaymentSuccess(candidateId, transactionId) {
  try {
    // Step 1: Verify payment with backend
    const verifyResponse = await fetch('/api/payment-success/' + candidateId, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const { success, formLink, candidate } = await verifyResponse.json();
    
    if (success) {
      console.log('✅ Payment verified for:', candidate.name);
      console.log('📋 Redirecting to form:', formLink);
      
      // Redirect to form
      window.location.href = formLink;
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
}
```

---

### 2. Load Candidate Form with Real Data

**Frontend Candidate Form Component:**
```javascript
// On candidate-form page load
async function loadCandidateData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get('candidateId');
    
    if (!candidateId) {
      console.error('No candidateId provided');
      return;
    }
    
    // Fetch real candidate data
    const response = await fetch(
      `/api/candidate-form/data?candidateId=${candidateId}`,
      { method: 'GET' }
    );
    
    const { success, data } = await response.json();
    
    if (success) {
      console.log('✅ Loaded candidate data:', data);
      
      // Pre-populate form
      document.getElementById('fullName').value = data.fullName || '';
      document.getElementById('email').value = data.email || '';
      document.getElementById('phone').value = data.phone || '';
      document.getElementById('country').value = data.country || '';
      document.getElementById('skills').value = data.skills || '';
      document.getElementById('experience').value = data.experience || '';
      
      // Set hidden field
      document.getElementById('candidateId').value = candidateId;
    }
  } catch (error) {
    console.error('Failed to load candidate data:', error);
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadCandidateData);
```

---

### 3. Submit Candidate Form

**Frontend Form Submit Handler:**
```javascript
async function submitCandidateForm(event) {
  event.preventDefault();
  
  const candidateId = document.getElementById('candidateId').value;
  
  const formData = {
    candidateId,
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    country: document.getElementById('country').value,
    skills: document.getElementById('skills').value,
    experience: document.getElementById('experience').value,
    photoUrl: document.getElementById('photoUrl').value || '',
    videoUrl: document.getElementById('videoUrl').value || '',
    resumeUrl: document.getElementById('resumeUrl').value || '',
    passportUrl: document.getElementById('passportUrl').value || '',
    medicalUrl: document.getElementById('medicalUrl').value || '',
    additionalUrl: document.getElementById('additionalUrl').value || ''
  };
  
  try {
    const response = await fetch('/api/candidates/form/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const { success, message, data } = await response.json();
    
    if (success) {
      console.log('✅ Form submitted successfully!');

      let messageText = 'Registration successful!';
      if (data && data.candidateId) {
        messageText += '\nCandidate ID: ' + data.candidateId;
      }
      if (data && data.password) {
        messageText += '\nPassword: ' + data.password;
      }

      alert(messageText + '\nPlease copy these credentials and keep them safe.');
      
      // Do not redirect to payment or dashboard; registration is complete.
      return;
    } else {
      alert('Error: ' + message);
    }
  } catch (error) {
    console.error('Form submission error:', error);
    alert('Failed to submit form');
  }
}
```

---

### 4. HTML Form Template

```html
<form id="candidateForm" onsubmit="submitCandidateForm(event)">
  <input type="hidden" id="candidateId" value="">
  
  <div class="form-group">
    <label>Full Name</label>
    <input type="text" id="fullName" required>
  </div>
  
  <div class="form-group">
    <label>Email</label>
    <input type="email" id="email" required>
  </div>
  
  <div class="form-group">
    <label>Phone</label>
    <input type="tel" id="phone" required>
  </div>
  
  <div class="form-group">
    <label>Country</label>
    <input type="text" id="country">
  </div>
  
  <div class="form-group">
    <label>Skills</label>
    <textarea id="skills"></textarea>
  </div>
  
  <div class="form-group">
    <label>Experience (years)</label>
    <input type="text" id="experience">
  </div>
  
  <div class="form-group">
    <label>Photo URL</label>
    <input type="url" id="photoUrl">
  </div>
  
  <div class="form-group">
    <label>Video URL</label>
    <input type="url" id="videoUrl">
  </div>
  
  <div class="form-group">
    <label>Resume URL</label>
    <input type="url" id="resumeUrl">
  </div>
  
  <div class="form-group">
    <label>Passport URL</label>
    <input type="url" id="passportUrl">
  </div>
  
  <div class="form-group">
    <label>Medical URL</label>
    <input type="url" id="medicalUrl">
  </div>
  
  <div class="form-group">
    <label>Additional Documents URL</label>
    <input type="url" id="additionalUrl">
  </div>
  
  <button type="submit" class="btn-primary">REGISTER</button>
</form>
```

---

### 5. API Endpoints Reference

**Base URL:** `https://your-backend-url` (or http://localhost:3000 for testing)

#### Payment Submission
```
POST /api/submitpayments/submitPayment
Body: {
  "userId": "+254712345678",
  "email": "candidate@example.com",
  "name": "John Doe",
  "amount": 500,
  "transactionCode": "TX_123456",
  "paymentMethod": "mpesa"
}
Response: {
  "success": true,
  "candidateFormLink": "https://blissconnect12.netlify.app/candidate-form?candidateId=...",
  "paymentId": "..."
}
```

#### Verify Payment
```
GET /api/payment-success/{candidateId}
Response: {
  "success": true,
  "formLink": "https://blissconnect12.netlify.app/candidate-form?candidateId=...",
  "candidate": {
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

#### Get Candidate Data
```
GET /api/candidate-form/data?candidateId={candidateId}
Response: {
  "success": true,
  "data": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678",
    "country": "Kenya",
    "skills": "...",
    "experience": "...",
    "photoUrl": "...",
    "videoUrl": "...",
    "isVerified": true,
    "paymentStatus": "completed"
  }
}
```

#### Submit Form
```
POST /api/candidates/form/submit
Body: {
  "candidateId": "{candidateId}",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "country": "Kenya",
  "skills": "JavaScript, React, Node.js",
  "experience": "5 years",
  "photoUrl": "https://...",
  "videoUrl": "https://...",
  "resumeUrl": "https://...",
  "passportUrl": "https://...",
  "medicalUrl": "https://..."
}
Response: {
  "success": true,
  "message": "Candidate form submitted successfully",
  "data": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "isVerified": true,
    "paymentStatus": "completed"
  }
}
```

---

### 6. Error Handling

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API error');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}
```

---

### 7. Example Complete Flow

```javascript
// 1. User completes payment
async function onPaymentComplete(candidateId, transactionId) {
  // Verify payment
  const { success, formLink } = await apiCall(`/api/payment-success/${candidateId}`);
  if (success) {
    // Redirect to form
    window.location.href = formLink;
  }
}

// 2. Form page loads - get real data
async function initializeForm() {
  const candidateId = new URLSearchParams(window.location.search).get('candidateId');
  const { success, data } = await apiCall(`/api/candidate-form/data?candidateId=${candidateId}`);
  
  if (success) {
    // Pre-fill form with real data
    populateForm(data);
  }
}

// 3. User submits form
async function handleFormSubmit(formData) {
  const { success, message } = await apiCall('/api/candidates/form/submit', {
    method: 'POST',
    body: formData
  });
  
  if (success) {
    alert('✅ Profile saved! Check your email for confirmation.');
  }
}
```

---

## Testing in Development

**Backend running on:** `http://localhost:3000`

**Test payment flow:**
```bash
curl -X POST http://localhost:3000/api/submitpayments/submitPayment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "+254712345678",
    "email": "test@example.com",
    "name": "Test User",
    "amount": 500,
    "transactionCode": "TEST123",
    "paymentMethod": "mpesa"
  }'
```

**Expected:** Response in <100ms with candidateFormLink

---

## Email Notifications

Users will automatically receive emails at:
1. ✅ Payment success - with candidate form link
2. ✅ Form submission - confirmation message
3. ✅ Application updates - status changes

No additional frontend code needed for emails - backend handles it automatically!

---

## Support

If you encounter issues:
1. Check backend logs for error messages
2. Verify MongoDB connection (`MONGO_URI` in .env)
3. Verify email credentials (`EMAIL_USER`, `EMAIL_PASS`)
4. Test individual endpoints with curl
5. Check network tab in browser DevTools

**All data is REAL from MongoDB - not dummy data!** ✅
