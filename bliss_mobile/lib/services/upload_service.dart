import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class UploadService {
  static const String baseUrl = ApiConfig.baseUrl;

  static Future<String?> uploadFile({
    String? filePath,
    Uint8List? bytes,
    required String fileName,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/upload'),
      );

      if (bytes != null) {
        request.files.add(http.MultipartFile.fromBytes(
          'image',
          bytes,
          filename: fileName,
        ));
      } else if (filePath != null) {
        request.files.add(await http.MultipartFile.fromPath(
          'image',
          filePath,
        ));
      } else {
        throw Exception('No file content available');
      }

      final response = await request.send();
      final resBody = await response.stream.bytesToString();
      final data = jsonDecode(resBody);

      if (response.statusCode == 200 && data['success'] == true) {
        final rawUrl = data['url'] as String?;
        if (rawUrl == null) return null;
        if (rawUrl.startsWith('http')) return rawUrl;
        return '$baseUrl$rawUrl';
      }

      debugPrint('Upload failed: ${data['error']}');
      return null;
    } catch (e) {
      debugPrint('Upload error: $e');
      return null;
    }
  }
}
