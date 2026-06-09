import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../services/backend_auth.dart';
import '../../config/app_config.dart';

class InterviewApiService {
  static final String _base = AppConfig.backendUrl;

  /// Schedule an interview request from employer to candidate
  static Future<Map<String, dynamic>> scheduleInterview({
    required String employerId,
    required String candidateId,
    required DateTime dateTime,
    String? notes,
  }) async {
    try {
      final token = BackendAuth.token;
      final resp = await http.post(
        Uri.parse('$_base/api/interviews/request'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'employerId': employerId,
          'candidateId': candidateId,
          'scheduledAt': dateTime.toUtc().toIso8601String(),
          'notes': notes ?? '',
        }),
      );

      final data = jsonDecode(resp.body);
      if ((resp.statusCode == 200 || resp.statusCode == 201) &&
          data['success'] == true) {
        return {'success': true, 'data': data};
      }
      return {'success': false, 'error': data['error'] ?? 'request_failed'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
