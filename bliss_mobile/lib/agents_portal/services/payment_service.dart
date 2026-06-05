import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:bliss_mobile/config/app_config.dart';

class PaymentService {
  static final String _base = AppConfig.backendUrl;

  // ------------------------
  // Create Payment
  // ------------------------
  Future<String> createPayment({
    required String name,
    required String phone,
    required String transactionCode,
    required double amount,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_base/submitPayment'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              "name": name,
              "phone": phone,
              "transactionCode": transactionCode,
              "amount": amount,
            }),
          )
          .timeout(const Duration(seconds: 15));

      print("STATUS: ${response.statusCode}");
      print("BODY: ${response.body}");

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return data['paymentId'] ?? '';
      } else {
        throw Exception(
          data['error'] ?? data['message'] ?? 'Payment failed',
        );
      }
    } catch (e) {
      throw Exception('Payment error: $e');
    }
  }

  // ------------------------
  // Verify Payment (optional backend endpoint)
  // ------------------------
  Future<bool> verifyPayment(String paymentId) async {
    try {
      final response = await http.get(
        Uri.parse('$_base/payments/$paymentId'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'completed';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ------------------------
  // Commission Calculations
  // ------------------------
  double calculateAgentCommission(double amount) {
    const rate = 0.20;
    return amount * rate;
  }

  double calculateBlissIncome(double amount) {
    const rate = 0.20;
    return amount * rate;
  }
}
