// lib/screens/services/payment_service.dart
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:mpesa_flutter_plugin/mpesa_flutter_plugin.dart';
import 'package:flutterwave_standard/flutterwave.dart';
import 'package:uuid/uuid.dart';
import '../config/app_config.dart';

class PaymentService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final uuid = const Uuid();

  /// Creates a payment intent (for keeping track)
  Future<String> createPaymentIntent({
    required String candidateId,
    required double amount,
    required String paymentMethod, // 'mpesa', 'card', 'flutterwave'
    required String title,
  }) async {
    final intentId = uuid.v4();
    await _db.collection('payment_intents').doc(intentId).set({
      'intentId': intentId,
      'candidateId': candidateId,
      'amount': amount,
      'paymentMethod': paymentMethod,
      'title': title,
      'status': 'pending',
      'createdAt': DateTime.now().toIso8601String(),
    });
    return intentId;
  }

  /// Submits payment using MPESA or Flutterwave (or card simulation)
  Future<bool> submitPayment({
    required BuildContext context,
    required String intentId,
    required String candidateId,
    required double amount,
    required String paymentMethod, // 'mpesa' / 'flutterwave' / 'card'
    required String title,
    required String phoneNumber, // e.g. "07XXXXXXXX"
    String? email,
    String? fullName,
    String currency = "KES",
    String? flutterwavePublicKey,
    String? flutterwaveSecretKey, // not used client side — but placeholder
  }) async {
    // Prevent double payment
    final existing = await _db
        .collection('payments')
        .where('candidateId', isEqualTo: candidateId)
        .where('title', isEqualTo: title)
        .where('status', isEqualTo: 'verified')
        .limit(1)
        .get();

    if (existing.docs.isNotEmpty) {
      return false;
    }

    bool autoVerified = false;
    String transactionId = "";

    if (paymentMethod.toLowerCase() == 'mpesa') {
      // MPESA STK Push
      try {
        final resp = await MpesaFlutterPlugin.initializeMpesaSTKPush(
          businessShortCode: "600100",
          transactionType: TransactionType.CustomerPayBillOnline,
          amount: amount,
          partyA: "254${phoneNumber.substring(1)}",
          partyB: "600100",
          accountReference: intentId,
          phoneNumber: "254${phoneNumber.substring(1)}",
          callBackURL: Uri.parse("https://your-backend.com/callback"),
          transactionDesc: title,
          passKey: "YOUR_MPESA_PASSKEY",
          baseUri: Uri.parse("https://sandbox.safaricom.co.ke"),
        );
        if (resp['ResponseCode'] == '0') {
          transactionId = resp['CheckoutRequestID'];
          autoVerified = true; // or wait for callback verification
        }
      } catch (e) {
        autoVerified = false;
      }
    } else if (paymentMethod.toLowerCase() == 'flutterwave') {
      if (flutterwavePublicKey == null || email == null || fullName == null) {
        throw Exception(
            "Flutterwave publicKey, email and fullName are required");
      }

      final Customer customer = Customer(
        name: fullName,
        phoneNumber: phoneNumber,
        email: email,
      );

      final Flutterwave flutterwave = Flutterwave(
        publicKey: flutterwavePublicKey,
        currency: currency,
        redirectUrl: "https://your-backend.com/callback", // optional
        txRef: intentId,
        amount: amount.toString(),
        customer: customer,
        paymentOptions: "card, mpesa, banktransfer",
        customization: Customization(
          title: "bliss connect Payment",
          description: title,
        ),
        isTestMode: true, // set false in production
      );

      final ChargeResponse response = await flutterwave.charge(context);

      if (response.status == "successful") {
        transactionId = response.transactionId ?? uuid.v4();
        autoVerified = true;
      }
    } else {
      // Simulated card / manual payment
      autoVerified = true;
      transactionId = uuid.v4();
    }

    // Save payment record
    await _db.collection('payments').doc(intentId).set({
      'intentId': intentId,
      'candidateId': candidateId,
      'amount': amount,
      'paymentMethod': paymentMethod,
      'transactionId': transactionId,
      'autoVerified': autoVerified,
      'status': autoVerified ? 'verified' : 'pending_verification',
      'title': title,
      'createdAt': DateTime.now().toIso8601String(),
    });

    return autoVerified;
  }

  /// Check if already paid
  Future<bool> hasPaid({
    required String candidateId,
    required String title,
  }) async {
    final q = await _db
        .collection('payments')
        .where('candidateId', isEqualTo: candidateId)
        .where('title', isEqualTo: title)
        .where('status', isEqualTo: 'verified')
        .limit(1)
        .get();
    return q.docs.isNotEmpty;
  }

  /// Manually verify a payment (if using manual verification)
  Future<void> verifyManually(String intentId) async {
    await _db.collection('payments').doc(intentId).update({
      'status': 'verified',
      'manuallyVerified': true,
      'verifiedAt': DateTime.now().toIso8601String(),
    });
  }

  /// Submit payment via backend endpoint and record result in Firestore
  Future<bool> submitPaymentBackend({
    required String intentId,
    required String candidateId,
    required double amount,
    required String title,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.backendUrl}/payment'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'intentId': intentId,
              'userId': candidateId,
              'amount': amount,
              'title': title,
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final resp = jsonDecode(response.body);
        if (resp['success'] == true) {
          await _db.collection('payments').doc(intentId).set({
            'intentId': intentId,
            'candidateId': candidateId,
            'amount': amount,
            'paymentMethod': 'backend',
            'transactionId': resp['transactionId'] ?? resp['id'] ?? '',
            'autoVerified': true,
            'status': 'verified',
            'title': title,
            'createdAt': DateTime.now().toIso8601String(),
            'backendResponse': resp,
          });
          return true;
        } else {
          await _db.collection('payments').doc(intentId).set({
            'intentId': intentId,
            'candidateId': candidateId,
            'amount': amount,
            'paymentMethod': 'backend',
            'transactionId': '',
            'autoVerified': false,
            'status': 'failed',
            'title': title,
            'createdAt': DateTime.now().toIso8601String(),
            'backendResponse': resp,
            'backendError':
                resp['error'] ?? resp['message'] ?? 'Payment failed',
          });
          return false;
        }
      } else {
        await _db.collection('payments').doc(intentId).set({
          'intentId': intentId,
          'candidateId': candidateId,
          'amount': amount,
          'paymentMethod': 'backend',
          'transactionId': '',
          'autoVerified': false,
          'status': 'failed',
          'title': title,
          'createdAt': DateTime.now().toIso8601String(),
          'backendStatusCode': response.statusCode,
          'backendBody': response.body,
        });
        return false;
      }
    } catch (e) {
      await _db.collection('payments').doc(intentId).set({
        'intentId': intentId,
        'candidateId': candidateId,
        'amount': amount,
        'paymentMethod': 'backend',
        'transactionId': '',
        'autoVerified': false,
        'status': 'error',
        'title': title,
        'createdAt': DateTime.now().toIso8601String(),
        'error': e.toString(),
      });
      return false;
    }
  }
}
