import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'api_client.dart';

class CandidateService {
  final ApiClient api;
  CandidateService(this.api);

  Future<List<Map<String, dynamic>>> getApplications() async {
    final res = await api.get('/api/candidate_portal/applications');
    return (res['data'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];
  }

  Future<List<Map<String, dynamic>>> getInterviews() async {
    final res = await api.get('/api/candidate_portal/interviews');
    return (res['data'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];
  }

  Future<bool> acceptInterview(String id) async {
    final res =
        await api.post('/api/candidate_portal/interviews/$id/accept', {});
    return res['success'] == true;
  }

  Future<bool> declineInterview(String id) async {
    final res =
        await api.post('/api/candidate_portal/interviews/$id/decline', {});
    return res['success'] == true;
  }

  Future<List<Map<String, dynamic>>> getDocuments() async {
    final res = await api.get('/api/candidate_portal/documents');
    return (res['data'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];
  }

  Future<Map<String, dynamic>> uploadDocument(
      PlatformFile file, String documentType) async {
    if (file.bytes == null || file.bytes!.isEmpty) {
      throw Exception('Unable to read selected file.');
    }

    final uri =
        Uri.parse('${api.baseUrl}/api/candidate_portal/documents/upload');
    final request = http.MultipartRequest('POST', uri);

    if (api.authToken != null) {
      request.headers['Authorization'] = 'Bearer ${api.authToken}';
    }
    request.fields['documentType'] = documentType;
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      file.bytes!,
      filename: file.name,
      contentType: MediaType('application', 'octet-stream'),
    ));

    final response = await request.send();
    final body = await response.stream.bytesToString();
    return json.decode(body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    final res = await api.get('/api/candidate_portal/notifications');
    return (res['data'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];
  }

  Future<bool> markNotificationsRead(List<String> ids) async {
    final res =
        await api.put('/api/candidate_portal/notifications/read', {'ids': ids});
    return res['success'] == true;
  }

  Future<Map<String, dynamic>> getProgress() async {
    final res = await api.get('/api/candidate_portal/progress');
    return (res['data'] as Map<String, dynamic>?) ?? {'progress': 0};
  }

  Future<List<Map<String, dynamic>>> getConversations() async {
    final res = await api.get('/api/candidate_portal/conversations');
    return (res['data'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];
  }

  Future<Map<String, dynamic>> sendMessage(
      String conversationId, String text) async {
    final res = await api.post(
        '/api/candidate_portal/conversations/$conversationId/messages',
        {'text': text});
    return res;
  }

  Future<List<Map<String, dynamic>>> getOpportunities() async {
    final uri = Uri.parse('${api.baseUrl}/api/marketplace/candidates');
    final response = await http.get(uri, headers: api.authHeaders);
    final parsed = json.decode(response.body) as Map<String, dynamic>;
    return (parsed['data'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];
  }
}
