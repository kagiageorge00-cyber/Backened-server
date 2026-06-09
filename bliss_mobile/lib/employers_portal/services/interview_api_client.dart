import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';

class InterviewApiClient {
  static final _base = AppConfig.backendUrl;

  static Future<Map<String, dynamic>> respondInterview({
    required String interviewId,
    required String candidateId,
    required String response, // 'accepted' or 'declined'
  }) async {
    try {
      final resp = await http.post(
        Uri.parse('$_base/api/interviews/$interviewId/respond'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'candidateId': candidateId, 'response': response}),
      );
      return jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> createMeeting(String interviewId) async {
    try {
      final resp = await http
          .post(Uri.parse('$_base/api/interviews/$interviewId/meeting'));
      return jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<List<Map<String, dynamic>>> fetchInterviewsForCandidate(
      String candidateId) async {
    try {
      final resp = await http
          .get(Uri.parse('$_base/api/interviews/candidate/$candidateId'));
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        final list = List.from(data['data'] ?? []);
        return list.map((e) => Map<String, dynamic>.from(e)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
