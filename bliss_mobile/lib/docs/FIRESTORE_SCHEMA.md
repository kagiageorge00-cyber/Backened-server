# Firestore Schema for bliss connect App

This document outlines all collections, documents, and fields used in the Bliss Mobile app.  
Use this as a reference when creating or querying data in Firestore.

---

## 1. Collection: `candidates`
- **DocumentID:** `candidate.id` (auto-generated or custom)
- **Fields:**
  - `fullName`: String
  - `age`: int
  - `gender`: String
  - `country`: String
  - `skills`: List<String>
  - `hireCost`: double
  - `status`: String (`applied`, `interviewed`, `booked`, `visa`, `ticketed`, `deployed`)
  - `passportNumber`: String
  - `photoUrl`: String (URL to photo)
  - `resumeUrl`: String (URL to resume)
  - `createdAt`: Timestamp

---

## 2. Collection: `employers`
- **DocumentID:** `employer.id` (auto-generated or custom)
- **Fields:**
  - `name`: String
  - `email`: String
  - `phone`: String
  - `companyLogoUrl`: String
  - `marketplaceBalance`: double
  - `createdAt`: Timestamp

---

## 3. Collection: `payments`
- **DocumentID:** auto-generated
- **Fields:**
  - `employerId`: String (reference to employers)
  - `candidateId`: String (reference to candidates)
  - `amount`: double
  - `transactionId`: String
  - `status`: String (`pending`, `verified`, `failed`)
  - `timestamp`: Timestamp

---

## 4. Collection: `employer_packs`
- **DocumentID:** `employerId` (reference to employer)
- **Subcollection:** `candidates`
  - **DocumentID:** `candidateId` (reference to candidate)
  - **Fields:**
    - `candidateName`: String
    - `hireCost`: double
    - `status`: String (`interviewed`, `booked`, `visa`, `ticketed`, `deployed`)
    - `hiredAt`: Timestamp

---

## Notes

- **Field names must match exactly** in your Flutter code when creating or reading documents.  
- **Timestamps:** Use `FieldValue.serverTimestamp()` for automatic server time.  
- **Subcollections:** `employer_packs/candidates` is used to track candidates under a specific employer.  
- **Status values:** Keep consistent (`applied`, `interviewed`, `booked`, `visa`, `ticketed`, `deployed`) for workflow tracking.
