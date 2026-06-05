import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class PaymentService {
  static final String _base = AppConfig.backendUrl;

  // ===============================
  // CREATE PAYMENT
  // ===============================
  static Future<String?> createPayment({
    required String name,
    required String phone,
    required double amount,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_base/api/payments/payment'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              "name": name,
              "phone": phone,
              "amount": amount,
              "paymentMethod": "mpesa",
              "userId": phone,
            }),
          )
          .timeout(AppConfig.apiTimeout);

      if (AppConfig.enableDetailedLogging) {
        print("🔥 CREATE STATUS: ${response.statusCode}");
        print("🔥 CREATE BODY: ${response.body}");
      }

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return data['paymentId'];
      }

      return null;
    } catch (e) {
      print("❌ CREATE ERROR: $e");
      return null;
    }
  }

  // ===============================
  // VERIFY PAYMENT (SIMPLIFIED)
  // ===============================
  static Future<bool> verifyPayment(String phone) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_base/api/payments/verify'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({"userId": phone}),
          )
          .timeout(AppConfig.apiTimeout);

      if (AppConfig.enableDetailedLogging) {
        print("🔥 VERIFY STATUS: ${response.statusCode}");
        print("🔥 VERIFY BODY: ${response.body}");
      }

      final data = jsonDecode(response.body);

      return response.statusCode == 200 && data['success'] == true;
    } catch (e) {
      print("❌ VERIFY ERROR: $e");
      return false;
    }
  }

  // ===============================
  // FULL FLOW (🔥 FINAL WORKING)
  // ===============================
  static Future<bool> processPayment({
    required String name,
    required String phone,
    required double amount,
  }) async {
    final paymentId = await createPayment(
      name: name,
      phone: phone,
      amount: amount,
    );

    if (paymentId == null) return false;

    // ⏳ small delay (mpesa simulation)
    await Future.delayed(const Duration(seconds: 2));

    final verified = await verifyPayment(phone);

    return verified;
  }

  // ===============================
  // COMMISSIONS
  // ===============================
  static double calculateAgentCommission(double amount) {
    return amount * 0.20;
  }

  static double calculateBlissIncome(double amount) {
    return amount * 0.20;
  }
}
