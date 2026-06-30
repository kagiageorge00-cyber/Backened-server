# CODE LOCATION REFERENCE - WHERE DATA IS LOST

## QUICK LOOKUP: Find Each Problem in the Code

---

## 1. REGISTRATION ENDPOINT - PRIMARY BOTTLENECK

### File: `routes/register.js`

#### The Problem: Incomplete Field Destructuring
**Location**: Line 59-73
```javascript
const {
  fullName,
  email,
  country,
  photoUrl,
  videoUrl,
  passportUrl,
  medicalUrl,
  conductUrl,
  resumeUrl,
  additionalUrl,
  jobAppliedFor,
  appliedJobId,
  appliedJobTitle,
  appliedEmployerId,
  appliedEmployerName,
} = req.body;
// ❌ MISSING: experience, skills, languages, nationality, religion, 
//             education, gender, dateOfBirth, maritalStatus, numberOfChildren,
//             destinationPreference
```

#### The Consequence: Database Saves with Nulls
**Location**: Line 200-280 (candidate.create)
```javascript
candidate = await Candidate.create({
  fullName,
  name: fullName,
  email,
  phone,
  country,
  photoUrl,
  videoUrl,
  passportUrl,
  medicalUrl,
  conductUrl,
  resumeUrl,
  additionalUrl,
  jobAppliedFor,
  appliedJobId,
  appliedJobTitle,
  appliedEmployerId,
  appliedEmployerName,
  uniqueCode,
  password: hashedPassword,
  // ❌ NEVER SET: experience, skills, languages, nationality, religion,
  //               education, gender, dateOfBirth, maritalStatus, numberOfChildren,
  //               destinationPreference (defaults to undefined/null)
  documents: { ... },
  isVerified: false,
  paymentStatus: "pending",
  status: "in_process",
});
```

---

## 2. FORM SUBMISSION ENDPOINT - SAVES CORRECTLY BUT TOO LATE

### File: `routes/candidateRoutes.js`

#### Location Saves Correctly: Line 324-360
```javascript
router.post('/form/submit', async (req, res) => {
  try {
    const {
      candidateId,
      phone,
      fullName,
      email,
      country,
      nationality,      ✅ ACCEPTS
      religion,         ✅ ACCEPTS
      education,        ✅ ACCEPTS
      skills,           ✅ ACCEPTS
      languages,        ✅ ACCEPTS
      experience,       ✅ ACCEPTS
      gender,           ✅ ACCEPTS
      dateOfBirth,      ✅ ACCEPTS
      maritalStatus,    ✅ ACCEPTS
      jobType,
      destinationPreference,  ✅ ACCEPTS
      preferredDestination,
      preferredDestinations,
      currentStatus,
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
      paymentId,
    } = req.body;
```

#### But Updates Candidate AFTER Registration
**Location**: Line 390-480 (candidate save logic)
- Correctly updates all 11 lost fields
- But candidate already appears empty on marketplace
- By this time, employer may have already seen incomplete profile

---

## 3. SCHEMA DEFINITION - MISSING FIELDS

### File: `models/candidate.js`

#### Fields in Schema
**Location**: Line 1-210 (entire candidateSchema definition)

#### Missing Fields (Not in Schema)
- Line: N/A - These fields are completely absent:
  - ❌ `age` - Expected field, not in schema
  - ❌ `expectedSalary` - Expected field, not in schema
  - ❌ `medicalAvailable` - Expected field, not in schema
  - ❌ `passportAvailable` - Expected field, not in schema
  - ❌ `videoAvailable` - Expected field, not in schema
  - ❌ `destinationCountry` - Expected field, not in schema

#### Fields With Wrong Names
- Line 77: `numberOfChildren: Number` - Expected API name: `children`
- Line 24: `jobAppliedFor: String` - Expected API name: `jobPosition`

#### Fields Saved But Not Used
**Location**: Line 77
```javascript
numberOfChildren: Number,  // ✅ In schema
// ❌ But form/submit never saves to this field
// ❌ Form accepts different fields for this concept
```

---

## 4. MARKETPLACE ENDPOINTS - CORRECT BUT RECEIVING EMPTY DATA

### File 1: `routes/candidateRoutes.js`

#### Marketplace Return Function: buildMarketplaceCandidate()
**Location**: Line 160-190
```javascript
function buildMarketplaceCandidate(candidate) {
  const candidateObj = normalizeCandidate(candidate);
  // ...
  return {
    candidateId: candidateObj.candidateId,
    name: candidateObj.name,
    fullName: candidateObj.fullName,
    age: candidateObj.age,           // ⚠️ PROBLEM: age doesn't exist in schema
    ageLabel: candidateObj.age !== null ? `${candidateObj.age} Years` : null,
    nationality: candidateObj.nationality,  // ⚠️ Tries to return but is null
    religion: candidateObj.religion,        // ⚠️ Tries to return but is null
    experience: experienceLabel,            // ⚠️ Tries to return but is null
    languages: languages,                   // ⚠️ Tries to return but is empty []
    skills: skills,                         // ⚠️ Tries to return but is empty []
    education: candidateObj.education || candidateObj.educationalLevel,
    destinationPreference: destination,     // ⚠️ Tries to return but is null
    photoUrl: candidateObj.photoUrl,
    profileCompletion: candidateObj.profileCompletion,  // ⚠️ Always 0
    currentStatus: candidateObj.currentStatus,
    status: candidateObj.status,
  };
}
```

#### Marketplace List Endpoint
**Location**: Line 135-150
```javascript
router.get('/marketplace', async (req, res) => {
  try {
    const candidates = await Candidate.find({ isVerified: true, status: 'available' })
      .sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: candidates.length,
      data: candidates.map(buildMarketplaceCandidate),  // ✅ Correct formatter
      // ❌ But buildMarketplaceCandidate receives empty data from DB
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
```

### File 2: `routes/marketplace.js`

#### Marketplace Detail Endpoint
**Location**: Line 36-45
```javascript
router.get('/candidates', async (req, res) => {
  try {
    if (!requireVerifiedEmployer(req, res)) return;

    const { country, skills, experience, verified, page = 1, limit = 20 } = req.query;
    const query = { isVerified: true, status: 'available' };
    
    const skip = (Number(page) - 1) * Number(limit);
    const candidates = await Candidate.find(query)
      .skip(skip)
      .limit(Number(limit))
      .select('-password');

    return res.json({ 
      success: true, 
      data: candidates.map(normalizeMarketplaceCandidate)  // ✅ Correct formatter
      // ❌ But normalizeMarketplaceCandidate receives empty data
    });
```

#### Normalization Function
**Location**: Line 16-20
```javascript
function normalizeMarketplaceCandidate(candidate) {
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  if (!candidateObj.candidateId) {
    candidateObj.candidateId = candidateObj.uniqueCode || (candidateObj._id ? candidateObj._id.toString() : null);
  }
  return candidateObj;  // ✅ Correctly returns raw object, but object has nulls
}
```

---

## 5. PROFILE COMPLETION CALCULATION - NEVER IMPLEMENTED

### File: `routes/candidate_api.js` or `routes/candidateRoutes.js`

#### Function Definition
**Location**: `routes/candidate_api.js` Line ~140
```javascript
function computeProfileCompletion(candidate) {
  const fields = ['fullName', 'email', 'phone', 'country', 'nationality', 
                  'skills', 'experience', 'gender', 'dateOfBirth', 'idNumber', 'education'];
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const present = fields.reduce((count, key) => {
    const value = candidateObj[key];
    if (Array.isArray(value)) return value.length > 0 ? count + 1 : count;
    return value ? count + 1 : count;
  }, 0);
  return Math.min(100, Math.round((present / fields.length) * 100));
}
```

#### Problem: Never Called
- ✅ Function exists
- ❌ Never called when candidate is registered
- ❌ Never called when form is submitted
- Result: profileCompletion always stays 0

---

## 6. CLIENT REGISTRATION ISSUE

### Issue: Client Probably Doesn't Send Profile Fields

**Why**: The registration endpoint doesn't accept these fields
**Evidence**: 
- Registration endpoint only destructures 15 specific fields
- No generic spreading of req.body
- Client wouldn't know to send fields that the endpoint doesn't use

**Where Client Code Is**: 
- Probably in separate frontend repository
- But check these docs for integration specs:
  - `FRONTEND_INTEGRATION.md` - Line 220-280
  - `WEB_APP_INTEGRATION_GUIDE.md` - Line 42-100
  - `API_ENDPOINTS_STATUS.md` - Line 199

---

## 7. SUMMARY OF BROKEN INTEGRATIONS

### Chain of Failures

1. **Client Code** (Not inspected)
   - Probably sends only basic fields (fullName, email, country, photoUrl, etc.)
   - Doesn't send profile fields (experience, skills, languages, etc.)
   - Because endpoint doesn't accept them anyway

2. **Registration Endpoint** (`routes/register.js` line 59)
   - ❌ Doesn't destructure profile fields
   - ❌ Doesn't save profile fields
   - ❌ Doesn't request them from client

3. **Database** (`models/candidate.js`)
   - ✅ Has fields defined
   - ❌ But registration endpoint never populates them
   - Result: All profile fields are null

4. **Marketplace Endpoints** (`routes/candidateRoutes.js`, `routes/marketplace.js`)
   - ✅ Correct retrieval and formatting logic
   - ❌ But receives empty data from database
   - Tries to return null/empty values

5. **Form Submission** (`routes/candidateRoutes.js` line 324)
   - ✅ Correctly saves all fields
   - ❌ But too late - candidate already listed empty
   - Only rescues profile for subsequent views

---

## HOW TO TRACE EACH FIELD

### Example: `experience` field

```
TRACE: experience field journey through system
═══════════════════════════════════════════════

✅ SCHEMA: models/candidate.js line 10
   experience: String,

❌ REGISTRATION: routes/register.js line 59
   (NOT in destructuring - LOST HERE!)
   
❌ DATABASE: Would be null/undefined
   (Never saved by registration)

✅ FORM/SUBMIT: routes/candidateRoutes.js line 324
   (Would accept it here)

✅ MARKETPLACE: routes/candidateRoutes.js line 160-190
   (Would return it here if it existed)


KEY: ❌ LOST = Registration endpoint doesn't extract from request
```

### Example: `age` field

```
TRACE: age field journey through system
════════════════════════════════════════

❌ SCHEMA: models/candidate.js line 1-210
   (NOT DEFINED - FIELD MISSING!)
   
❌ REGISTRATION: routes/register.js line 59
   (Can't save what's not in schema)

❌ FORM/SUBMIT: routes/candidateRoutes.js line 324
   (Could accept it but schema doesn't have it)

❌ MARKETPLACE: routes/candidateRoutes.js line 160-190
   age: candidateObj.age,  // ← Returns undefined
   

KEY: ❌ LOST = Field doesn't exist in schema
```

---

## IMMEDIATE ACTIONS NEEDED

### 1. Register Endpoint Fix Required
- File: `routes/register.js` line 59
- Add destructuring for: experience, skills, languages, nationality, religion, education, gender, dateOfBirth, maritalStatus, destinationPreference, numberOfChildren

### 2. Schema Update Required
- File: `models/candidate.js` 
- Add missing fields: age (calculated), expectedSalary, medicalAvailable, passportAvailable, videoAvailable, destinationCountry

### 3. Profile Completion Calculation
- Call `computeProfileCompletion()` after registration
- Call it after form/submit update
- Store result in `profileCompletion` field

### 4. Client Integration Review Needed
- Check if client can send all profile fields
- Check if client documentation is accurate
- See: `FRONTEND_INTEGRATION.md`, `WEB_APP_INTEGRATION_GUIDE.md`

---

## FILES CREATED IN THIS INVESTIGATION

1. **MARKETPLACE_DATA_LOSS_REPORT.md** - Full detailed analysis
2. **FIELD_TRACKING_TABLE.md** - Quick reference table
3. **DATA_FLOW_ANALYSIS.md** - Visual timeline and flow diagrams
4. **CODE_LOCATION_REFERENCE.md** - This file (where to look in code)
