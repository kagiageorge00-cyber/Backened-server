import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentService {
  // final FirestoreService _firestoreService = FirestoreService();

  // ------------------------
  // Add new payment record
  // ------------------------
  Future<String> createPayment({
    required String name,
    required String phone,
    required String transactionCode,
  }) async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/submitPayment'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        "name": name,
        "phone": phone,
        "transactionCode": transactionCode,
      }),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['paymentId'] ?? '';
    } else {
      throw Exception(data['error'] ?? data['message'] ?? 'Payment failed');
    }
  }

  // ------------------------
  // Mark payment as completed
  // ------------------------
  // TODO: Implement completePayment using backend endpoint if available

  // ------------------------
  // Mark payment as failed
  // ------------------------
  // TODO: Implement failPayment using backend endpoint if available

  // ------------------------
  // Calculate agent commission
  // ------------------------
  double calculateAgentCommission(double employerPaymentAmount) {
    const double commissionRate = 0.20; // 20% commission
    return employerPaymentAmount * commissionRate;
  }

  // ------------------------
  // Calculate net income for bliss connect
  // ------------------------
  double calculateBlissIncome(double employerPaymentAmount) {
    const double commissionRate = 0.20; // 20% commission
    return employerPaymentAmount * commissionRate;
  }

  // ------------------------
  // Get all payments for a user (agent/employer)
  // ------------------------
  // TODO: Implement getUserPayments using backend endpoint

  // ------------------------
  // Get all payments (admin)
  // ------------------------
  // TODO: Implement getAllPayments using backend endpoint
}
