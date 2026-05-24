import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class BackendService {
  static final String baseUrl = AppConfig.backendUrl;

  // Health check
  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/health'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      throw Exception('Health check failed');
    } catch (e) {
      return {'status': 'unhealthy', 'error': e.toString()};
    }
  }

  // Get statistics
  static Future<Map<String, dynamic>> getStats() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/stats'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      throw Exception('Failed to get stats');
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  // Post demo jobs manually
  static Future<bool> postDemoJobs() async {
    try {
      final response = await http.post(Uri.parse('$baseUrl/jobs/post-demo'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Submit payment for processing
  static Future<Map<String, dynamic>> submitPayment({
    required String method,
    required double amount,
    required String phoneNumber,
    required String description,
    String? email,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payments/submit'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'method': method,
          'amount': amount,
          'phoneNumber': phoneNumber,
          'description': description,
          'email': email,
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      throw Exception('Payment submission failed');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Send WhatsApp message
  static Future<bool> sendWhatsAppMessage({
    required String phoneNumber,
    required String message,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/whatsapp/send'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'phoneNumber': phoneNumber,
          'message': message,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Get automated service status
  static Future<Map<String, dynamic>> getServiceStatus() async {
    try {
      final health = await checkHealth();
      final stats = await getStats();

      return {
        'health': health,
        'stats': stats,
        'automated_services': {
          'job_posting': 'running',
          'payment_processing': 'running',
          'reminders': 'running',
          'cleanup': 'running',
        }
      };
    } catch (e) {
      return {'error': e.toString()};
    }
  }
}
