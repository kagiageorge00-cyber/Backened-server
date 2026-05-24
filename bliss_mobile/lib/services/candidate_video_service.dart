import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';

class CandidateVideoService {
  static Future<Map<String, dynamic>> uploadCandidateVideo({
    required String userId,
    required File videoFile,
  }) async {
    final uri =
        Uri.parse('${AppConfig.backendUrl}/api/users/$userId/upload-video');
    final request = http.MultipartRequest('POST', uri)
      ..files.add(await http.MultipartFile.fromPath('video', videoFile.path,
          contentType: MediaType('video', 'mp4')));
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Video upload failed');
    }
  }

  static Future<void> reviewCandidateVideo({
    required String userId,
    required String action, // 'approve' or 'reject'
  }) async {
    final uri = Uri.parse('${AppConfig.backendUrl}/api/admin/review-video');
    final resp = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'userId': userId, 'action': action}),
    );
    final data = jsonDecode(resp.body);
    if (resp.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error'] ?? 'Review failed');
    }
  }

  static Future<List<dynamic>> getApprovedCandidates() async {
    final uri =
        Uri.parse('${AppConfig.backendUrl}/api/users/candidates-approved');
    final resp = await http.get(uri);
    final data = jsonDecode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return data['candidates'] as List<dynamic>;
    } else {
      throw Exception(data['error'] ?? 'Failed to fetch candidates');
    }
  }
}
