# EXECUTIVE SUMMARY - MARKETPLACE API DATA LOSS

**Investigation Status**: ✅ COMPLETE - Data loss points identified  
**Severity**: 🔴 CRITICAL - Marketplace displays empty candidate profiles  
**Root Cause**: Registration endpoint doesn't accept profile fields  

---

## THE PROBLEM IN 30 SECONDS

The marketplace API returns candidates with empty profiles because:

1. **Registration endpoint** (POST /api/register) doesn't accept profile fields
2. **These fields never get saved** during candidate registration
3. **Candidate appears on marketplace EMPTY** before form submission
4. **Form submission endpoint** (POST /api/candidates/form/submit) could save them, but it's too late
5. Result: Employers see blank profiles with only names and photo URLs

---

## WHAT'S BROKEN

### Current Response (EMPTY)
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

### Expected Response (FULL)
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

## DATA LOSS BREAKDOWN

| Category | Count | Fields |
|----------|-------|--------|
| **Fields NOT accepted by registration endpoint** | 11 | experience, skills, languages, nationality, religion, education, gender, dateOfBirth, maritalStatus, destinationPreference, numberOfChildren |
| **Fields MISSING from MongoDB schema entirely** | 6 | age, expectedSalary, medicalAvailable, passportAvailable, videoAvailable, destinationCountry |
| **Field name MISMATCHES** | 2 | children (vs numberOfChildren), jobPosition (vs jobAppliedFor) |
| **Calculations NEVER PERFORMED** | 1 | profileCompletion (always 0) |

**Total Data Loss**: 20 fields affected

---

## ROOT CAUSE: REGISTRATION ENDPOINT

### File: `routes/register.js` (Line 59)

The registration endpoint destructures ONLY these fields:
```javascript
const {
  fullName, email, country, photoUrl, videoUrl, 
  passportUrl, medicalUrl, conductUrl, resumeUrl, 
  additionalUrl, jobAppliedFor, appliedJobId, etc.
} = req.body;
```

It does NOT include:
```javascript
// ❌ MISSING FROM DESTRUCTURING:
// experience, skills, languages, nationality, religion,
// education, gender, dateOfBirth, maritalStatus, numberOfChildren,
// destinationPreference
```

### Result

When database saves the candidate:
```javascript
await Candidate.create({
  fullName,        // ✅ SAVED
  email,           // ✅ SAVED  
  country,         // ✅ SAVED
  experience,      // ❌ NULL (never extracted)
  skills,          // ❌ NULL (never extracted)
  languages,       // ❌ NULL (never extracted)
  nationality,     // ❌ NULL (never extracted)
  religion,        // ❌ NULL (never extracted)
  education,       // ❌ NULL (never extracted)
  // ... etc
});
```

---

## WHERE DATA IS LOST

```
CLIENT SENDS DATA
    ↓
REGISTRATION ENDPOINT (routes/register.js)
    ├─ ✅ Accepts: fullName, country, photoUrl, etc.
    └─ ❌ Ignores: experience, skills, languages, etc.
    ↓
DATABASE SAVES
    ├─ ✅ Basic fields: fullName, country
    └─ ❌ Profile fields: NULL (never received)
    ↓
MARKETPLACE API RETURNS
    ├─ ✅ fullName: "John Doe"
    ├─ ❌ experience: null
    ├─ ❌ skills: []
    └─ ❌ languages: []
```

The data is **NOT lost in the database or API layer**.  
The data is **lost because the registration endpoint never accepts it**.

---

## WHEN DATA FINALLY APPEARS

The form submission endpoint (`POST /api/candidates/form/submit`) correctly accepts and saves all profile fields.

But this happens **AFTER** the candidate is already:
1. ✅ Registered
2. ✅ Marked as "in_process"
3. ✅ Listed on marketplace (EMPTY!)
4. ✅ Visible to employers (with blank profile)

By the time the form is submitted and profile is complete, employers may have already skipped this candidate for having an incomplete profile.

---

## SCHEMA ISSUES

The MongoDB schema (`models/candidate.js`) is also incomplete:

### Missing Entirely
- `age` - Expected field (should calculate from dateOfBirth)
- `expectedSalary` - Expected in API response
- `medicalAvailable` - Expected field
- `passportAvailable` - Expected field
- `videoAvailable` - Expected field
- `destinationCountry` - Expected field

### Field Name Mismatches
- Schema has `numberOfChildren` but expected API field is `children`
- Schema has `jobAppliedFor` but expected API field is `jobPosition`

### Never Calculated
- `profileCompletion` - Always stays 0 (function exists but never called)

---

## INVESTIGATION DELIVERABLES

Created detailed reports documenting:

1. **MARKETPLACE_DATA_LOSS_REPORT.md** (11 KB)
   - Complete field-by-field analysis
   - All 20 affected fields tracked
   - File locations and line numbers
   - Root cause analysis

2. **FIELD_TRACKING_TABLE.md** (5 KB)
   - Quick reference table format
   - Shows: Schema → Registration → Form/Submit → Marketplace
   - Easy lookup for each field

3. **DATA_FLOW_ANALYSIS.md** (8 KB)
   - Visual timeline diagrams
   - Shows when data is lost in the flow
   - Illustrates broken vs expected flows

4. **CODE_LOCATION_REFERENCE.md** (12 KB)
   - Exact file names and line numbers
   - Code snippets showing problems
   - Trace examples for each field type

---

## KEY STATISTICS

- **Lines of code affected**: ~3 files need changes
- **Fields requiring fixing**: 20 total
  - 11 need registration endpoint update
  - 6 need schema addition
  - 2 need field name standardization
  - 1 needs calculation implementation
- **Impact on candidate visibility**: 100% (all empty profiles returned)
- **Time to reproduce**: Immediate (register any candidate)

---

## VERIFICATION

To verify this issue:

1. **Register a candidate** via POST /api/register with basic data (name, email, etc.)
2. **Check marketplace** via GET /api/candidates/marketplace or GET /api/marketplace/candidates
3. **Observe**: All profile fields are null/empty
4. **Then submit form** via POST /api/candidates/form/submit with profile data
5. **Check marketplace again**: Profile now shows (but was empty before!)

Database query to check:
```javascript
// Check newly registered candidate
db.candidates.findOne({ candidateId: "CAND-2026-7247" })

// Should show:
// {
//   fullName: "Candidate",    ✅ Filled
//   experience: null,          ❌ Empty
//   skills: [],                ❌ Empty
//   languages: [],             ❌ Empty
//   nationality: null,         ❌ Empty
//   religion: null,            ❌ Empty
//   education: null,           ❌ Empty
// }
```

---

## SUMMARY TABLE

| Metric | Value |
|--------|-------|
| **Root Cause** | Registration endpoint incomplete destructuring |
| **Primary File** | routes/register.js (line 59) |
| **Secondary File** | models/candidate.js (incomplete schema) |
| **Data Loss Type** | Accepted by client but not stored by server |
| **When Discovered** | On marketplace retrieval (returns empty) |
| **When Fixed** | After form submission (too late) |
| **Severity** | CRITICAL |
| **User Impact** | Candidates invisible on marketplace until form complete |
| **Employer Impact** | See incomplete profiles initially |
| **Fix Complexity** | Low-Medium (adding fields to destructuring) |

---

## NEXT STEPS (DO NOT IMPLEMENT YET)

As requested, no code changes have been made. Investigation complete.

When ready to fix:
1. Add 11 profile fields to registration endpoint destructuring
2. Add 6 missing fields to MongoDB schema
3. Implement profileCompletion calculation
4. Standardize field names (age, children, jobPosition)
5. Create integration tests to prevent regression

---

## CONCLUSION

The marketplace API returns empty candidate data not because of a retrieval or formatting problem, but because the registration endpoint is incomplete. It fails to accept and save critical profile fields that should be required during the registration process.

The form submission endpoint later tries to rescue this by accepting all fields, but by then the candidate has already appeared on the marketplace as empty, potentially harming visibility and employer engagement.

**Investigation Status**: ✅ **COMPLETE**  
**No code changes made** per user request.  
**Ready for implementation** when needed.
