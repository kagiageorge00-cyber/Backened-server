# DATA FLOW ANALYSIS - MARKETPLACE API DATA LOSS

## Timeline: Candidate Registration to Marketplace Display

```
TIME 1: INITIAL REGISTRATION
================================

CLIENT SENDS (to POST /api/register)
├─ fullName, email, phone, country
├─ photoUrl, videoUrl, passportUrl, medicalUrl
├─ resumeUrl, additionalUrl, conductUrl
├─ jobAppliedFor, appliedJobId, etc.
└─ ❌ NO: experience, skills, languages, nationality, religion, education, etc.

         ↓ routes/register.js (line 59)
         
SERVER RECEIVES
├─ Destructures ONLY these fields from req.body
├─ ✅ ACCEPTS: fullName, email, country, photoUrl, videoUrl, etc.
└─ ❌ IGNORES: experience, skills, languages, nationality, religion, education, etc.
              (These keys are never extracted from request)

         ↓ routes/register.js (line 200-280)
         
DATABASE SAVES
├─ fullName: "John Doe"          ✅ SAVED
├─ email: "john@email.com"       ✅ SAVED
├─ country: "Kenya"              ✅ SAVED
├─ photoUrl: "https://..."       ✅ SAVED
├─ skills: null                  ❌ NOT SAVED (never received)
├─ languages: null               ❌ NOT SAVED (never received)
├─ nationality: null             ❌ NOT SAVED (never received)
├─ religion: null                ❌ NOT SAVED (never received)
├─ experience: null              ❌ NOT SAVED (never received)
├─ education: null               ❌ NOT SAVED (never received)
├─ gender: null                  ❌ NOT SAVED (never received)
├─ dateOfBirth: null             ❌ NOT SAVED (never received)
├─ maritalStatus: null           ❌ NOT SAVED (never received)
├─ destinationPreference: null   ❌ NOT SAVED (never received)
├─ numberOfChildren: null        ❌ NOT SAVED (never received)
└─ status: "in_process"          ✅ SAVED (auto-set)


TIME 2: CANDIDATE APPEARS ON MARKETPLACE (EMPTY!)
===================================================

CLIENT CALLS: GET /api/candidates/marketplace

         ↓ routes/candidateRoutes.js (line 135)
         ↓ Candidate.find({ isVerified: true, status: 'available' })
         
DATABASE RETURNS: Candidate document with nulls

         ↓ buildMarketplaceCandidate() (line 160-190)
         
SERVER FORMATS
├─ candidateId: "CAND-2026-7247"     ✅ Found
├─ fullName: "John Doe"              ✅ Found
├─ experience: null                  ❌ EMPTY (never saved)
├─ skills: []                        ❌ EMPTY (never saved)
├─ languages: []                     ❌ EMPTY (never saved)
├─ nationality: null                ❌ EMPTY (never saved)
├─ religion: null                   ❌ EMPTY (never saved)
├─ education: null                  ❌ EMPTY (never saved)
├─ age: undefined (field missing!)   ❌ ERROR (age doesn't exist in schema)
└─ ...all other profile fields null  ❌ ALL EMPTY

         ↓ API RESPONSE
         
MARKETPLACE SHOWS:
{
  "candidateId": "CAND-2026-7247",
  "fullName": "John Doe",
  "experience": null,
  "skills": [],
  "languages": [],
  "nationality": null,
  "religion": null,
  "education": null,
  "age": undefined,  ← ERROR: age field doesn't exist
  "profileCompletion": 0
}


TIME 3: CANDIDATE COMPLETES FORM
=================================

CLIENT SENDS (to POST /api/candidates/form/submit)
├─ fullName, email, phone, country          ✅ (again)
├─ photoUrl, videoUrl, passportUrl, etc.   ✅ (again)
├─ ✅ NOW INCLUDES: experience, skills, languages
├─ ✅ NOW INCLUDES: nationality, religion, education
├─ ✅ NOW INCLUDES: gender, dateOfBirth, maritalStatus
└─ ✅ NOW INCLUDES: destinationPreference, etc.

         ↓ routes/candidateRoutes.js (line 324)
         
SERVER RECEIVES: All profile fields ✅

         ↓ routes/candidateRoutes.js (line 390-480)
         
DATABASE UPDATES
├─ experience: "3 Years"           ✅ NOW SAVED
├─ skills: ["Cleaning", "Care"]   ✅ NOW SAVED
├─ languages: ["English", "Swahili"]  ✅ NOW SAVED
├─ nationality: "Kenyan"          ✅ NOW SAVED
├─ religion: "Christian"          ✅ NOW SAVED
├─ education: "Secondary"         ✅ NOW SAVED
├─ gender: "Female"               ✅ NOW SAVED
├─ dateOfBirth: "1997-05-14"     ✅ NOW SAVED
├─ maritalStatus: "Single"        ✅ NOW SAVED
└─ destinationPreference: ["UAE"]  ✅ NOW SAVED


TIME 4: CANDIDATE APPEARS ON MARKETPLACE (WITH DATA!)
=======================================================

CLIENT CALLS: GET /api/candidates/marketplace

         ↓ Database returns candidate with all fields filled ✅
         ↓ buildMarketplaceCandidate() formats it
         
MARKETPLACE NOW SHOWS:
{
  "candidateId": "CAND-2026-7247",
  "fullName": "John Doe",
  "experience": "3 Years",       ✅ NOW FILLED
  "skills": ["Cleaning", "Care"], ✅ NOW FILLED
  "languages": ["English", "Swahili"],  ✅ NOW FILLED
  "nationality": "Kenyan",       ✅ NOW FILLED
  "religion": "Christian",       ✅ NOW FILLED
  "education": "Secondary",      ✅ NOW FILLED
  "age": undefined,              ⚠️ STILL ERROR (age field missing)
  "profileCompletion": 0         ⚠️ STILL 0 (never calculated)
}
```

---

## THE DATA LOSS PROBLEM IN ONE PICTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW (BROKEN)                        │
└─────────────────────────────────────────────────────────────────────┘

CLIENT WITH FULL DATA
│
├─ fullName, email, phone, country ──┐
├─ photoUrl, videoUrl, etc.          │
├─ experience                        │
├─ skills                            │
├─ languages                         │
├─ nationality                       │ TO POST /api/register
├─ religion                          │
├─ education                         │
└─ gender, dateOfBirth, etc.         │
                                     ↓
                        POST /api/register
                        (routes/register.js)
                        
                        DESTRUCTURES ONLY:
                        const {
                          fullName, email, country,
                          photoUrl, videoUrl, etc.
                          ❌ NO experience
                          ❌ NO skills
                          ❌ NO languages
                          ❌ NO nationality
                          ❌ NO religion
                          ❌ NO education
                          ❌ NO gender
                          ❌ NO dateOfBirth
                        }
                        
                                    ↓
                        
                        DATABASE SAVES
                        ✅ fullName
                        ✅ country
                        ❌ experience (= null)
                        ❌ skills (= null)
                        ❌ languages (= null)
                        ❌ nationality (= null)
                        ❌ religion (= null)
                        ❌ education (= null)
                        ❌ gender (= null)
                        ❌ dateOfBirth (= null)
                        
                                    ↓
                        
                    MARKETPLACE API RETURNS
                        ❌ EMPTY PROFILE
                        
                        
┌─────────────────────────────────────────────────────────────────────┐
│            FORM SUBMISSION (LATE RESCUE - TOO LATE!)                 │
└─────────────────────────────────────────────────────────────────────┘

CLIENT WITH FORM DATA
│
├─ fullName, email, phone, country ──┐
├─ photoUrl, videoUrl, etc.          │
├─ experience                        │
├─ skills                            │
├─ languages                         │
├─ nationality                       │ TO POST /api/candidates/form/submit
├─ religion                          │
├─ education                         │
└─ gender, dateOfBirth, etc.         │
                                     ↓
                        POST /api/candidates/form/submit
                        (routes/candidateRoutes.js)
                        
                        DESTRUCTURES ALL:
                        const {
                          fullName, email, country,
                          photoUrl, videoUrl,
                          ✅ experience
                          ✅ skills
                          ✅ languages
                          ✅ nationality
                          ✅ religion
                          ✅ education
                          ✅ gender
                          ✅ dateOfBirth
                        }
                        
                                    ↓
                        
                        DATABASE SAVES ALL
                        ✅ experience
                        ✅ skills
                        ✅ languages
                        ✅ nationality
                        ✅ religion
                        ✅ education
                        ✅ gender
                        ✅ dateOfBirth
                        
                                    ↓
                        
                    MARKETPLACE API RETURNS
                        ✅ FULL PROFILE
                        (BUT CANDIDATE ALREADY LISTED EMPTY!)
```

---

## KEY FINDINGS

### 1. REGISTRATION ENDPOINT IS THE BOTTLENECK
- File: `routes/register.js` line 59
- Problem: Destructuring doesn't include 11 critical fields
- Impact: These fields are NEVER saved during registration

### 2. FORM ENDPOINT TRIES TO RESCUE BUT TOO LATE
- File: `routes/candidateRoutes.js` line 324
- Correctly accepts all 11 fields
- But candidates already appear on marketplace as empty

### 3. CLIENT PROBABLY DOESN'T SEND PROFILE DATA IN REGISTRATION
- The /register endpoint doesn't accept these fields
- So the client probably doesn't send them either
- Needs investigation: Does client form have these fields?

### 4. SCHEMA MISSING CALCULATED/DERIVED FIELDS
- `age` - should calculate from dateOfBirth
- Availability flags (medicalAvailable, passportAvailable, videoAvailable) - should derive from URLs

### 5. NORMALIZATION FUNCTIONS ARE CORRECT
- They try to return profile fields
- But find nulls because registration didn't save them
- They're not the problem - they're the symptom

---

## WHERE DATA IS ACTUALLY LOST

```
                     LOST HERE ❌
                          ↓
DATA SENT BY CLIENT → REGISTRATION ENDPOINT → DATABASE (NULLS)
                          ↓
                    NEVER EXTRACTED
                    (Line 59 in register.js)
```

The data isn't lost because of retrieval or formatting.
The data is lost because the registration endpoint doesn't accept it.
