import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import '../config/app_config.dart';

class JobApplicationPaymentService {
  final String backendUrl;
  final http.Client client;
  final uuid = const Uuid();

  JobApplicationPaymentService({
    String? baseUrl,
    http.Client? client,
  })  : backendUrl = baseUrl ?? AppConfig.backendUrl,
        client = client ?? http.Client();

  /// ======================
  /// MAIN PAYMENT FLOW
  /// ======================
  Future<Map<String, dynamic>> submitPayment({
    required String candidateId,
    required String jobId,
    required String fullName,
    required String phoneNumber,
    required String email,
    required String paymentMethod,
    required double amount,
    required String transactionCode,
  }) async {
    try {
      if (fullName.isEmpty || phoneNumber.isEmpty) {
        return {'success': false, 'message': 'Missing required fields'};
      }

      final intentId = "INT_${DateTime.now().millisecondsSinceEpoch}";

      // ======================
      // 🚀 SEND TO BACKEND ONLY
      // ======================
      final response = await client.post(
        Uri.parse('$backendUrl/api/submitPayment'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': fullName.trim(),
          'phone': phoneNumber.trim(),
          'email': email.trim(),
          'transactionCode': transactionCode.trim(),
          'paymentMethod': paymentMethod,
          'amount': amount,
          'currency': 'KES',
          'bankAccountName': 'Bliss Connect',
          'bankName': 'Equity Bank',
          'bankAccountNumber': '0640179700069',
          'candidateId': candidateId,
          'jobId': jobId,
          'intentId': intentId,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'transactionId': data['transactionId'],
          'paymentLink': data['paymentLink'],
        };
      } else {
        return {
          'success': false,
          'message': data['error'] ?? 'Payment failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// ======================
  /// VERIFY PAYMENT (CLIENT SIDE FLAG)
  /// ======================
  Future<bool> verifyPayment() async {
    // 🔥 for now we trust backend response
    return true;
  }
}
