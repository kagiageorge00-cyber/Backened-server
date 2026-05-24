// INTEGRATION GUIDE: Job Application Payment Flow
//
// This document shows how to integrate the payment flow into your job application screen.

// Step 1: Import required files
import 'package:flutter/material.dart';
import 'lib/screens/job_application_payment_screen.dart';
import 'lib/services/job_application_payment_service.dart';

// Step 2: Navigate to payment screen after job application
void navigateToPayment(BuildContext context, {
  required String candidateId,
  required String jobId,
}) {
  Navigator.of(context).push(
    MaterialPageRoute(
      builder: (context) => JobApplicationPaymentScreen(
        candidateId: candidateId,
        jobId: jobId,
        jobApplicationFee: 1300, // KES
        currencyCode: 'KES',
      ),
    ),
  );
}

// Step 3: Example - Add payment button in apply_screen.dart
/*
ElevatedButton(
  onPressed: () {
    navigateToPayment(
      context,
      candidateId: 'candidate_123',
      jobId: 'job_456',
    );
  },
  child: const Text('Proceed to Payment'),
)
*/

// PAYMENT METHODS SUPPORTED:
// 1. M-Pesa (Kenya) - +254798242350
//    - Amount: KES 1300
//    - User sends payment, enters transaction code
//    - Status: pending until verified
//
// 2. Stripe (Card Payment)
//    - International cards supported
//    - Placeholder ready for integration
//
// 3. Western Union
//    - MTCN reference required
//    - International option
//
// 4. Wire Transfer
//    - Bank details provided
//    - SWIFT/IBAN supported
//    - International option

// PAYMENT STATUS FLOW:
// pending  → candidate submits payment info
// verified → payment confirmed on backend
// failed   → duplicate or invalid transaction

// BACKEND ENDPOINTS:
/*
POST /api/job-application-payments
  - Creates payment record
  - Prevents duplicate transaction codes
  - Returns: success, paymentId, message

GET /api/job-application-payments/:paymentId
  - Retrieves payment status
  - Returns: payment object

POST /api/job-application-payments/:paymentId/verify
  - Marks payment as verified
  - Returns: verified payment object

GET /api/job-application-payments/candidate/:candidateId
  - Gets all payments for candidate
  - Returns: payments array
*/

// DUPLICATE PREVENTION:
// Each transaction code can only be used once
// Database checks for existing transaction codes
// If duplicate found, rejection with error message

// NEXT STEPS TO FULLY IMPLEMENT:
// 1. Connect Mpesa STK push (use existing mpesa_flutter_plugin)
// 2. Set up Stripe integration with payment_intents
// 3. Add Western Union API for MTCN validation
// 4. Integrate bank verification for wire transfers
// 5. Add Firebase Cloud Functions for payment callbacks
// 6. Create admin dashboard to verify/confirm payments
