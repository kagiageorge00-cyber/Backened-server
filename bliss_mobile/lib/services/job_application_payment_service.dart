import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import '../models/job_application_payment.dart';
import '../config/app_config.dart';

class JobApplicationPaymentService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String backendUrl = AppConfig.backendUrl;
  final uuid = const Uuid();

  /// Submit job application payment
  Future<Map<String, dynamic>> submitPayment({
    required String candidateId,
    required String jobId,
    required String fullName,
    required String phoneNumber,
    required String
        paymentMethod, // 'mpesa', 'stripe', 'western_union', 'wire_transfer', 'moneygram'
    required String transactionCode,
    required double amount,
    String currency = 'KES',
    String mpesaNumber = '+254798242350',
    String? stripePaymentIntentId,
    String? westernUnionRef,
    String? wireTransferRef,
    String? moneyGramRef,
  }) async {
    try {
      // Validate inputs
      if (fullName.isEmpty || phoneNumber.isEmpty || transactionCode.isEmpty) {
        return {'success': false, 'message': 'Missing required fields'};
      }

      // Check for duplicate transaction code
      final existingPayment = await _db
          .collection('job_application_payments')
          .where('transactionCode', isEqualTo: transactionCode)
          .where('status', isNotEqualTo: 'failed')
          .limit(1)
          .get();

      if (existingPayment.docs.isNotEmpty) {
        return {
          'success': false,
          'message':
              'This transaction code has already been used. Please try again.'
        };
      }

      // Create payment document locally
      final paymentId = uuid.v4();
      final now = DateTime.now();

      final payment = JobApplicationPayment(
        id: paymentId,
        candidateId: candidateId,
        jobId: jobId,
        fullName: fullName,
        phoneNumber: phoneNumber,
        paymentMethod: paymentMethod,
        transactionCode: transactionCode,
        amount: amount,
        currency: currency,
        status: 'pending',
        mpesaNumber: mpesaNumber,
        stripePaymentIntentId: stripePaymentIntentId,
        westernUnionRef: westernUnionRef,
        wireTransferRef: wireTransferRef,
        moneyGramRef: moneyGramRef,
        createdAt: now,
        metadata: {
          'applicationSource': 'mobile_app',
          'ipAddress': 'client_ip',
        },
      );

      // Save to Firestore
      await _db
          .collection('job_application_payments')
          .doc(paymentId)
          .set(payment.toMap());

      // Send to backend API
      final backendResponse = await _savePaymentToBackend(
        paymentId: paymentId,
        payment: payment,
      );

      if (!backendResponse['success']) {
        // Mark payment as failed in Firestore
        await _db
            .collection('job_application_payments')
            .doc(paymentId)
            .update({'status': 'failed'});
        return {
          'success': false,
          'message': backendResponse['message'] ?? 'Backend error'
        };
      }

      return {
        'success': true,
        'message': 'Payment submitted. Await confirmation.',
        'paymentId': paymentId,
      };
    } catch (e) {
      return {'success': false, 'message': 'Error: ${e.toString()}'};
    }
  }

  /// Save payment to backend API
  Future<Map<String, dynamic>> _savePaymentToBackend({
    required String paymentId,
    required JobApplicationPayment payment,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$backendUrl/api/job-application-payments'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'paymentId': paymentId,
              'candidateId': payment.candidateId,
              'jobId': payment.jobId,
              'fullName': payment.fullName,
              'phoneNumber': payment.phoneNumber,
              'paymentMethod': payment.paymentMethod,
              'transactionCode': payment.transactionCode,
              'amount': payment.amount,
              'currency': payment.currency,
              'status': payment.status,
              'mpesaNumber': payment.mpesaNumber,
              'westernUnionRef': payment.westernUnionRef,
              'wireTransferRef': payment.wireTransferRef,
              'moneyGramRef': payment.moneyGramRef,
              'createdAt': payment.createdAt.toIso8601String(),
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return {'success': true, 'data': data};
        } else {
          return {
            'success': false,
            'message':
                data['error'] ?? data['message'] ?? 'Backend rejected payment'
          };
        }
      } else {
        return {'success': false, 'message': 'Backend rejected payment'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  /// Get payment status
  Future<String?> getPaymentStatus(String paymentId) async {
    try {
      final doc =
          await _db.collection('job_application_payments').doc(paymentId).get();
      return doc['status'];
    } catch (e) {
      return null;
    }
  }

  /// Verify payment on backend (called after manual verification)
  Future<bool> verifyPayment(String paymentId) async {
    try {
      final response = await http.post(
        Uri.parse('$backendUrl/api/job-application-payments/$paymentId/verify'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          await _db
              .collection('job_application_payments')
              .doc(paymentId)
              .update({
            'status': 'verified',
            'verifiedAt': DateTime.now().toIso8601String(),
          });
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Get candidate's payments
  Future<List<JobApplicationPayment>> getCandidatePayments(
      String candidateId) async {
    try {
      final snapshot = await _db
          .collection('job_application_payments')
          .where('candidateId', isEqualTo: candidateId)
          .orderBy('createdAt', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => JobApplicationPayment.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      return [];
    }
  }
}
