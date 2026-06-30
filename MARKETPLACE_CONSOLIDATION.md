# Marketplace API Consolidation & Profile Completion Implementation

## Overview
This document explains the changes made to fix marketplace data consistency issues and consolidate duplicate endpoints.

## Changes Made

### 1. Schema Updates (models/candidate.js)
- Added missing marketplace fields: `jobPosition`, `destinationCountry`, `expectedSalary`
- Reorganized schema into 8 clearly commented sections
- Maintained backward compatibility

### 2. Profile Completion Calculation
**standardProfileCompletion Fields (11 marketplace-required fields):**
- photoUrl
- nationality
- religion  
- education
- experience
- skills
- languages
- dateOfBirth
- jobPosition
- expectedSalary
- destinationCountry

**Implementation Locations:**
1. `routes/candidateRoutes.js` - `calculateProfileCompletion()` function
2. `routes/candidate_api.js` - `computeProfileCompletion()` function (updated to match)
3. `scripts/backfill_profile_completion.js` - Migration script to backfill existing candidates

**Storage:**
- Calculated and persisted to database in candidate.profileCompletion after form submission
- Database becomes single source of truth for profileCompletion

### 3. Form Submission Handler (routes/candidateRoutes.js)
**POST /form/submit Updates:**
- Now accepts and saves all 11 marketplace fields
- Calculates profileCompletion after save for both new and existing candidates
- Both create and update paths properly initialized with all fields

**Affected Fields:**
- jobPosition, destinationCountry, expectedSalary (new marketplace fields)
- educationalLevel, numberOfChildren (profile enhancements)
- All fields properly fallback to existing values if not provided

### 4. Marketplace Data Response Format

#### buildMarketplaceCandidate() in candidateRoutes.js
**Structured 21-field response organized by category:**
- **IDENTIFICATION**: candidateId, fullName
- **PERSONAL**: nationality, religion, age, maritalStatus, numberOfChildren
- **PROFESSIONAL**: jobPosition, experience, education, skills, languages, expectedSalary
- **LOCATION**: destinationCountry, destinationPreference
- **MEDIA**: photoUrl, videoAvailable, passportAvailable, medicalAvailable (flags only, not URLs)
- **STATUS**: profileCompletion, currentStatus, status, availability

**Sensitive Data Handling:**
- Document URLs (videoUrl, passportUrl, medicalUrl) replaced with boolean flags
- Phone and email excluded from marketplace response
- Only photoUrl returned (actual URL, not just flag)

#### normalizeMarketplaceCandidate() in marketplace.js
- Updated to mirror buildMarketplaceCandidate() format
- Ensures consistency between both marketplace endpoint implementations

### 5. Candidate Dashboard Updates (routes/candidate_api.js)
**Changes:**
- Updated `computeProfileCompletion()` to use same 11 marketplace fields
- Added marketplace fields to allowed profile update fields: jobPosition, jobType, destinationCountry, destinationPreference, expectedSalary, languages, educationalLevel, numberOfChildren
- Updated `normalizeCandidate()` to include all marketplace fields in dashboard responses

**Purpose:**
- Ensures profile completion calculated consistently across all endpoints
- Allows candidates to update their marketplace-relevant profile data
- Dashboard shows complete profile information

### 6. Migration & Backfill (scripts/backfill_profile_completion.js)
**Script Purpose:**
- Calculates profileCompletion for all existing candidates
- Uses same logic as calculateProfileCompletion()
- Only updates records that differ from current value
- Provides statistics on migration results

**Usage:**
```bash
node scripts/backfill_profile_completion.js
```

**Output:**
- Total candidates processed
- Number updated
- Error count
- Average/max/min completion statistics

## Endpoint Consolidation

### Current Marketplace Endpoints

**Primary (RECOMMENDED):**
```
GET /api/candidates/marketplace
- Returns list of verified, available candidates
- Data format: buildMarketplaceCandidate()
- Public endpoint (no authentication required)

GET /api/candidates/marketplace/profile/:candidateId
- Returns single candidate for marketplace view
- Data format: buildMarketplaceCandidate()
- Public endpoint (no authentication required)
```

**Secondary (LEGACY):**
```
GET /api/marketplace/candidates
- Returns list of verified, available candidates
- Data format: normalizeMarketplaceCandidate() (now matches buildMarketplaceCandidate)
- Requires verified employer authentication

GET /api/marketplace/candidates/:candidateId
- Returns single candidate for marketplace view
- Data format: normalizeMarketplaceCandidate() (now matches buildMarketplaceCandidate)
- Requires verified employer authentication
```

### Status
- ✅ Both endpoint implementations now return identical data structure
- ⚠️ Security difference: /api/candidates/marketplace is public, /api/marketplace requires auth
- 📋 Consider: In future, standardize to one endpoint set and authentication approach

### Migration Path (Future)
1. Add deprecation notice to /api/marketplace endpoints
2. Update frontend to use /api/candidates/marketplace
3. Evaluate adding authentication to /api/candidates/marketplace if needed
4. Remove /api/marketplace endpoints after deprecation period

## Data Flow

```
1. Candidate Registration (register.js)
   └─> Save basic fields: fullName, email, phone, uniqueCode

2. Form Submission (POST /form/submit)
   └─> Accept all 11 marketplace fields
   └─> Calculate profileCompletion
   └─> Persist to database

3. Candidate Update (PUT /auth/profile)
   └─> Allow update of marketplace fields
   └─> Recalculate profileCompletion
   └─> Persist to database

4. Marketplace Query (GET /marketplace)
   └─> Load candidate with all fields
   └─> Call buildMarketplaceCandidate()
   └─> Return structured response with sensitive data removed

5. Employer Browse (GET /api/marketplace/candidates)
   └─> Load verified candidates
   └─> Call normalizeMarketplaceCandidate()
   └─> Return structured response (with auth verification)
```

## Testing Checklist

### Data Persistence
- [ ] POST /form/submit with all new fields saves correctly
- [ ] profileCompletion calculates based on 11 marketplace fields
- [ ] PUT /auth/profile can update marketplace fields
- [ ] GET /api/candidates/:id returns all fields

### Marketplace Response
- [ ] GET /api/candidates/marketplace returns correct 21-field structure
- [ ] GET /api/candidates/marketplace/profile/:id returns correct structure
- [ ] GET /api/marketplace/candidates returns same structure (with auth)
- [ ] Sensitive fields (phone, email, URLs) not exposed
- [ ] Boolean availability flags present (videoAvailable, etc.)

### Profile Completion
- [ ] New candidates with full profile show 100% completion
- [ ] Partial profiles show correct percentage
- [ ] profileCompletion persists across sessions
- [ ] Migration script backfills existing candidates

### Backward Compatibility
- [ ] Existing endpoints still work
- [ ] Tests for /api/candidates/marketplace pass
- [ ] Old candidate records still queryable
- [ ] Non-marketplace fields still accessible through other endpoints

## Known Issues & Considerations

1. **Endpoint Duplication**
   - Two endpoint sets return same data
   - Authentication differs between sets
   - Future: Consolidate to single endpoint set

2. **Public vs. Authenticated**
   - /api/candidates/marketplace is public
   - /api/marketplace is authenticated
   - Consider standardizing security approach

3. **Profile Completion Definition**
   - Based on marketplace-essential fields (not all profile fields)
   - Different from older dashboard completion calculations
   - May show lower percentages for existing candidates

4. **Migration Timing**
   - Run backfill script after deploying code
   - Verify statistics before and after in production
   - No candidate data is deleted, only computed fields updated

## Security Considerations

- Sensitive document URLs not exposed in marketplace responses
- Phone/email hidden from marketplace (contact released separately if needed)
- Verified status must be true for marketplace visibility
- Employer authentication provides additional access control option

## Files Modified

1. ✅ models/candidate.js - Schema reorganization
2. ✅ routes/candidateRoutes.js - Form submission, marketplace data
3. ✅ routes/candidate_api.js - Dashboard API synchronization
4. ✅ routes/marketplace.js - Normalized endpoint response
5. ✅ scripts/backfill_profile_completion.js - NEW: Migration script

## Files NOT Modified (Per Requirements)

- ❌ routes/register.js - Kept as-is (basic registration only)
- ❌ routes/candidate_api.js authentication - Kept as-is
- ❌ server.js routing structure - Kept as-is
- ❌ Frontend/UI - Kept as-is (data-only changes)

## Next Steps

1. Deploy database migration (run backfill script)
2. Run full test suite to verify endpoints
3. Monitor marketplace queries for new field data
4. Plan future consolidation of duplicate endpoints
