import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:http_parser/http_parser.dart';
import '../config/app_config.dart';

class CandidateVideoService {
  // ✅ UPDATED: FULL PROFILE UPLOAD (video + photos + resume)
  static Future<Map<String, dynamic>> uploadCandidateVideo({
    required String userId,
    required File videoFile,
    required File fullPhoto,
    required File idPhoto,
    required String resumeText,
  }) async {
    final uri =
        Uri.parse('${AppConfig.backendUrl}/api/upload-candidate/$userId');

    final request = http.MultipartRequest('POST', uri)
      ..files.add(await http.MultipartFile.fromPath(
        'video',
        videoFile.path,
        contentType: MediaType('video', 'mp4'),
      ))
      ..files.add(await http.MultipartFile.fromPath(
        'fullPhoto',
        fullPhoto.path,
        contentType: MediaType('image', 'jpeg'),
      ))
      ..files.add(await http.MultipartFile.fromPath(
        'idPhoto',
        idPhoto.path,
        contentType: MediaType('image', 'jpeg'),
      ))
      ..fields['resumeText'] = resumeText;

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Upload failed');
    }
  }

  // ✅ KEEP (unchanged)
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

  // ✅ KEEP (unchanged)
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
