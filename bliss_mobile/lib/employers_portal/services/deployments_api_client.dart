import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';

class DeploymentsApiClient {
  static final _base = AppConfig.backendUrl;

  static Future<Map<String, dynamic>> payDeployment({
    required String deploymentId,
    required String employerId,
    required double amount,
    String paymentMethod = 'card',
  }) async {
    try {
      final resp = await http.post(
        Uri.parse('$_base/api/deployments/$deploymentId/pay'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'employerId': employerId,
          'amount': amount,
          'paymentMethod': paymentMethod,
        }),
      );
      return jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
