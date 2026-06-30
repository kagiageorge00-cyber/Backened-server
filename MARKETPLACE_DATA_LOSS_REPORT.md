# MARKETPLACE API DATA LOSS INVESTIGATION REPORT

## Executive Summary
The marketplace API returns empty candidate data because the registration endpoint (POST /api/register) does not accept or save critical profile fields. These fields are only saved later in the form submission endpoint (POST /api/candidates/form/submit). Candidates appear on the marketplace with null values until they complete the full form.

---

## Current vs Expected Response

### Current Response (Empty)
```json
{
  "candidateId": "CAND-2026-7247",
  "fullName": "Candidate",
  "age": null,
  "experience": null,
  "languages": [],
  "skills": [],
  "profileCompletion": 0,
  "currentStatus": "Registration"
}
```

### Expected Response (Full)
```json
{
  "candidateId": "CAND-2026-7247",
  "fullName": "John Doe",
  "nationality": "Kenyan",
  "religion": "Christian",
  "jobPosition": "Housemaid",
  "destinationCountry": "UAE",
  "age": 27,
  "maritalStatus": "Single",
  "children": 0,
  "education": "Secondary",
  "experience": "3 Years",
  "expectedSalary": "1200 AED",
  "skills": ["Housekeeping", "Cleaning"],
  "languages": ["English", "Swahili"],
  "photoUrl": "...",
  "videoAvailable": true,
  "passportAvailable": true,
  "medicalAvailable": true
}
```

---

## FIELD-BY-FIELD ANALYSIS

### Expected Fields Tracking

| FIELD | IN SCHEMA? | SAVED IN REGISTER? | SAVED IN FORM/SUBMIT? | RETURNED BY MARKETPLACE? | ISSUE |
|-------|-----------|-------------------|----------------------|--------------------------|-------|
| candidateId | ✅ (Yes, but inconsistently used) | ✅ (as uniqueCode) | ✅ | ✅ | Uses uniqueCode instead of candidateId |
| fullName | ✅ | ✅ | ✅ | ✅ | OK |
| name | ✅ | ✅ | ✅ | ✅ | OK |
| email | ✅ | ✅ | ✅ | ✅ | OK |
| phone | ✅ | ✅ | ✅ | ✅ | OK |
| **age** | ❌ (NOT IN SCHEMA) | ❌ | ❌ | ❌ | **FIELD MISSING FROM SCHEMA - Uses dateOfBirth instead** |
| **experience** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **skills** | ✅ (Array) | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **languages** | ✅ (Array) | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **nationality** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **religion** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **education** / educationalLevel | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **gender** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **dateOfBirth** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **maritalStatus** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| **numberOfChildren** | ✅ | ❌ **REGISTER IGNORES** | ❌ (accepts as maritalStatus flow only) | ❌ | **DATA LOSS: Never saved** |
| **destinationPreference** | ✅ | ❌ **REGISTER IGNORES** | ✅ | ✅ (if form submitted) | **DATA LOSS: Not accepted in registration** |
| country | ✅ | ✅ | ✅ | ✅ | OK |
| photoUrl | ✅ | ✅ | ✅ | ✅ | OK |
| videoUrl | ✅ | ✅ | ✅ | ✅ | OK |
| passportUrl | ✅ | ✅ | ✅ | ✅ (if form submitted) | OK but not in registration |
| medicalUrl | ✅ | ✅ | ✅ | ✅ (if form submitted) | OK but not in registration |
| resumeUrl | ✅ | ✅ | ✅ | ✅ (if form submitted) | OK but not in registration |
| additionalUrl | ✅ | ✅ | ✅ | ❌ | Not returned |
| profileCompletion | ✅ | ❌ (defaults to 0) | ❌ (never calculated) | ✅ (but always 0) | **DATA LOSS: Never calculated** |
| currentStatus | ✅ | ❌ (not in register) | ✅ (defaults to "Registration") | ✅ | Returned but may be wrong |
| status | ✅ | ✅ (set to "in_process") | ✅ | ✅ | OK |
| isVerified | ✅ | ✅ (false) | ✅ | ✅ | OK |
| paymentStatus | ✅ | ✅ (pending) | ✅ | ❌ | Not returned |
| **jobPosition** | ❌ (Schema has jobAppliedFor) | ✅ (as jobAppliedFor) | ❌ | ❌ | **FIELD MISMATCH: jobAppliedFor in schema, not returned** |
| **expectedSalary** | ❌ | ❌ | ❌ | ❌ | **FIELD MISSING FROM SCHEMA** |
| **medicalAvailable** | ❌ | ❌ | ❌ | ❌ | **FIELD MISSING FROM SCHEMA** |
| **passportAvailable** | ❌ | ❌ | ❌ | ❌ | **FIELD MISSING FROM SCHEMA** |
| **videoAvailable** | ❌ | ❌ | ❌ | ❌ | **FIELD MISSING FROM SCHEMA** |
| **destinationCountry** | ❌ | ❌ | ❌ | ❌ | **FIELD MISSING FROM SCHEMA** |
| **children** | ✅ (as numberOfChildren) | ❌ | ❌ | ❌ | **FIELD MISMATCH: Schema has numberOfChildren, form doesn't use it** |

---

## ROOT CAUSE ANALYSIS

### 1. **Registration Route (POST /api/register) - CRITICAL ISSUE**
**File**: `routes/register.js` (line 59)

**What it accepts:**
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
```

**What it DOES NOT accept (but should):**
- nationality ❌
- religion ❌
- education ❌
- skills ❌
- languages ❌
- experience ❌
- gender ❌
- dateOfBirth ❌
- maritalStatus ❌
- numberOfChildren ❌
- age ❌
- destinationPreference ❌

**Impact**: Candidates registered via this endpoint will have these fields permanently NULL until the form/submit endpoint is called.

### 2. **Form Submit Route (POST /api/candidates/form/submit) - SAVES CORRECTLY**
**File**: `routes/candidateRoutes.js` (line 324)

**Accepts all profile fields** and saves them correctly.

**Problem**: This is called AFTER candidate appears on marketplace, so they appear empty initially.

### 3. **Marketplace Normalization Functions - CORRECTLY STRUCTURED**
**File 1**: `routes/candidateRoutes.js` - `buildMarketplaceCandidate()` (line 160)
- Returns all profile fields for display
- Problem: No data because registration didn't save them

**File 2**: `routes/marketplace.js` - `normalizeMarketplaceCandidate()` (line 16)
- Returns raw candidate object
- Problem: Same data loss issue

### 4. **Schema Issues**
**File**: `models/candidate.js`

**Missing fields:**
- `age` - NOT IN SCHEMA (should calculate from dateOfBirth or store separately)
- `expectedSalary` - NOT IN SCHEMA
- `destinationCountry` - NOT IN SCHEMA
- `medicalAvailable` - NOT IN SCHEMA (should be boolean based on medicalUrl presence)
- `passportAvailable` - NOT IN SCHEMA (should be boolean based on passportUrl presence)
- `videoAvailable` - NOT IN SCHEMA (should be boolean based on videoUrl presence)
- `children` - NOT IN SCHEMA (exists as numberOfChildren but not used in form)

---

## DATA FLOW TIMELINE

### Current Broken Flow
```
1. POST /api/register/register
   ├─ Input: fullName, email, country, photoUrl, videoUrl, etc.
   ├─ Output: candidate with EMPTY profile fields
   └─ Result: Candidate appears on marketplace with null values ❌

2. Candidate appears on marketplace (empty)
   └─ GET /api/candidates/marketplace returns empty profile ❌

3. POST /api/candidates/form/submit
   ├─ Input: ALL profile fields (nationality, education, skills, etc.)
   ├─ Output: candidate with FULL profile data
   └─ Result: Marketplace now shows data (refreshed) ✅
```

### Expected Flow
```
1. POST /api/register/register
   ├─ Input: ALL fields including profile data
   ├─ Output: candidate with FULL profile ✅
   └─ Result: Candidate ready for marketplace

2. Candidate appears on marketplace (full data)
   └─ GET /api/candidates/marketplace returns complete profile ✅

3. POST /api/candidates/form/submit
   └─ Used for updates/corrections only
```

---

## SUMMARY OF DATA LOSS POINTS

### Fields Never Saved (Lost in Registration)
1. ❌ **experience** - SAVED? No | SHOULD BE? Yes
2. ❌ **skills** - SAVED? No | SHOULD BE? Yes
3. ❌ **languages** - SAVED? No | SHOULD BE? Yes
4. ❌ **nationality** - SAVED? No | SHOULD BE? Yes
5. ❌ **religion** - SAVED? No | SHOULD BE? Yes
6. ❌ **education** - SAVED? No | SHOULD BE? Yes
7. ❌ **gender** - SAVED? No | SHOULD BE? Yes
8. ❌ **dateOfBirth** - SAVED? No | SHOULD BE? Yes
9. ❌ **maritalStatus** - SAVED? No | SHOULD BE? Yes
10. ❌ **numberOfChildren** - SAVED? No | SHOULD BE? Yes (never in form either)
11. ❌ **destinationPreference** - SAVED? No | SHOULD BE? Yes

### Fields Missing From Schema Entirely
1. ❌ **age** - SCHEMA? No | Workaround? Use dateOfBirth
2. ❌ **expectedSalary** - SCHEMA? No
3. ❌ **medicalAvailable** - SCHEMA? No | Workaround? Boolean from medicalUrl
4. ❌ **passportAvailable** - SCHEMA? No | Workaround? Boolean from passportUrl
5. ❌ **videoAvailable** - SCHEMA? No | Workaround? Boolean from videoUrl
6. ❌ **destinationCountry** - SCHEMA? No | Alternative? Use country

### Fields With Mismatches
1. ⚠️ **jobPosition** - Expected field | Schema has: jobAppliedFor | Not returned in marketplace
2. ⚠️ **children** - Expected field | Schema has: numberOfChildren | Never used in form endpoint

---

## DETAILED LOCATION REFERENCES

| Component | File | Lines | Issue |
|-----------|------|-------|-------|
| Schema Definition | `models/candidate.js` | 1-210 | Missing age, expectedSalary, availability booleans |
| Registration Endpoint | `routes/register.js` | 59-100 | Doesn't accept profile fields |
| Registration Save | `routes/register.js` | 200-280 | Creates candidate with only basic fields |
| Form Submit Endpoint | `routes/candidateRoutes.js` | 324-360 | Correctly accepts all fields |
| Form Submit Save | `routes/candidateRoutes.js` | 390-480 | Correctly saves all fields |
| Marketplace Return | `routes/candidateRoutes.js` | 135-220 | Calls buildMarketplaceCandidate() |
| Marketplace Formatter | `routes/candidateRoutes.js` | 160-190 | Attempts to return all fields but finds nulls |
| Alternative Marketplace | `routes/marketplace.js` | 16-92 | Returns raw object (also empty) |

---

## RECOMMENDATION FOR INVESTIGATION
1. ✅ Registration endpoint doesn't request profile fields from client
2. ✅ Client doesn't have a way to send profile data during registration
3. ✅ Profile data only enters system in form/submit, which happens AFTER marketplace listing
4. ✅ Schema is missing several fields entirely
5. ✅ Some field names don't match between expected API response and schema

**Conclusion**: Data is lost because the registration flow is incomplete. The integration point is broken between client submission and server saving.
