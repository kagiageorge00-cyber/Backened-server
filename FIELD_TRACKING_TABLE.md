# FIELD TRACKING TABLE - MARKETPLACE API DATA LOSS

## Quick Reference: Where Each Field is Lost

| FIELD | IN SCHEMA? | SAVED IN /register? | SAVED IN /form/submit? | RETURNED IN MARKETPLACE? |
|-------|-----------|:-----------------:|:---------------------:|:------------------------:|
| candidateId | ✅ | ✅ (as uniqueCode) | ✅ | ✅ |
| fullName | ✅ | ✅ | ✅ | ✅ |
| name | ✅ | ✅ | ✅ | ✅ |
| email | ✅ | ✅ | ✅ | ✅ |
| phone | ✅ | ✅ | ✅ | ✅ |
| country | ✅ | ✅ | ✅ | ✅ |
| photoUrl | ✅ | ✅ | ✅ | ✅ |
| videoUrl | ✅ | ✅ | ✅ | ✅ |
| passportUrl | ✅ | ✅ | ✅ | ✅ |
| medicalUrl | ✅ | ✅ | ✅ | ✅ |
| resumeUrl | ✅ | ✅ | ✅ | ✅ |
| additionalUrl | ✅ | ✅ | ✅ | ❌ |
| status | ✅ | ✅ | ✅ | ✅ |
| isVerified | ✅ | ✅ | ✅ | ✅ |
| paymentStatus | ✅ | ✅ | ✅ | ❌ |
| currentStatus | ✅ | ❌ | ✅ | ✅ |
| createdAt | ✅ | ✅ | ✅ | ❌ |
| **LOST: experience** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: skills** | ✅ | ❌ | ✅ | ✅ (but empty []) |
| **LOST: languages** | ✅ | ❌ | ✅ | ✅ (but empty []) |
| **LOST: nationality** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: religion** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: education** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: educationalLevel** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: gender** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: dateOfBirth** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: maritalStatus** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: numberOfChildren** | ✅ | ❌ | ❌ | ❌ |
| **LOST: destinationPreference** | ✅ | ❌ | ✅ | ✅ (but null) |
| **LOST: preferredDestinations** | ✅ | ❌ | ✅ | ✅ (but null) |
| jobAppliedFor | ✅ | ✅ | ✅ | ❌ |
| appliedJobId | ✅ | ✅ | ❌ | ❌ |
| appliedJobTitle | ✅ | ✅ | ❌ | ❌ |
| appliedEmployerId | ✅ | ✅ | ❌ | ❌ |
| appliedEmployerName | ✅ | ✅ | ❌ | ❌ |
| **MISSING: age** | ❌ | ❌ | ❌ | ❌ (tried but field doesn't exist) |
| **MISSING: expectedSalary** | ❌ | ❌ | ❌ | ❌ |
| **MISSING: medicalAvailable** | ❌ | ❌ | ❌ | ❌ |
| **MISSING: passportAvailable** | ❌ | ❌ | ❌ | ❌ |
| **MISSING: videoAvailable** | ❌ | ❌ | ❌ | ❌ |
| **MISSING: destinationCountry** | ❌ | ❌ | ❌ | ❌ |
| **MISMATCH: children** | ✅ (as numberOfChildren) | ❌ | ❌ | ❌ |
| **MISMATCH: jobPosition** | ✅ (as jobAppliedFor) | ✅ | ❌ | ❌ |

---

## LEGEND
- ✅ = Field exists / is saved / is returned
- ❌ = Field missing / not saved / not returned
- **LOST:** = Field exists in schema, saved in form/submit, but NOT saved in registration endpoint
- **MISSING:** = Field does not exist in schema
- **MISMATCH:** = Field name doesn't match between schema and API response

---

## CRITICAL ISSUES SUMMARY

### 1. Primary Data Loss (11 fields)
These fields are in the schema and CAN be saved (via form/submit) but are NOT accepted in the registration endpoint:
1. experience
2. skills
3. languages
4. nationality
5. religion
6. education
7. gender
8. dateOfBirth
9. maritalStatus
10. destinationPreference
11. preferredDestinations

**Root Cause**: Registration endpoint (routes/register.js) doesn't include these in destructuring

### 2. Never Saved (1 field)
- numberOfChildren - NOT accepted in form/submit endpoint either

### 3. Missing From Schema (6 fields)
- age
- expectedSalary
- medicalAvailable
- passportAvailable
- videoAvailable
- destinationCountry

### 4. Field Name Mismatches (2 fields)
- children → numberOfChildren (not used anywhere)
- jobPosition → jobAppliedFor (not returned by marketplace)

---

## FILES INVOLVED

### Schema Definition
- `models/candidate.js` - Defines all field types

### Data Entry Routes
- `routes/register.js` (POST /) - INCOMPLETE field acceptance
- `routes/candidateRoutes.js` (POST /form/submit) - COMPLETE field acceptance

### Data Retrieval Routes
- `routes/candidateRoutes.js` (GET /marketplace) - Uses buildMarketplaceCandidate()
- `routes/marketplace.js` (GET /candidates) - Uses normalizeMarketplaceCandidate()

### Data Normalization/Formatting
- `routes/candidateRoutes.js` (lines 16-50) - normalizeCandidate()
- `routes/candidateRoutes.js` (lines 160-190) - buildMarketplaceCandidate()
- `routes/marketplace.js` (lines 16-20) - normalizeMarketplaceCandidate()
- `routes/candidate_api.js` (lines 21-50) - normalizeCandidate()

---

## VERIFICATION COMMANDS

To verify data loss, run these checks in database:

```javascript
// Check candidate registered via /register (should have nulls)
db.candidates.findOne({ candidateId: "CAND-2026-7247" })
// Fields to check: experience, skills, languages, nationality, religion, education, gender, dateOfBirth, maritalStatus

// Check if same candidate has data after /form/submit
// (should show filled values)
```
