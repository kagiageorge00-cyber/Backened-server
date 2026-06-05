import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class CandidateMarketplaceService {
  static const String baseUrl = ApiConfig.baseUrl;

  /// ✅ CREATE CANDIDATE (MAIN FUNCTION)
  static Future<bool> createCandidate({
    required String candidateId,
    required String fullName,
    required String phone,
    required String country,
    required String jobCategory,
    required String skills,
    required String experience,
    required String salary,
    String? videoUrl,
  }) async {
    try {
      debugPrint('Create candidate POST → $baseUrl/api/candidates');
      final response = await http.post(
        Uri.parse("$baseUrl/api/candidates"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "candidateId": candidateId,
          "fullName": fullName,
          "phone": phone,
          "country": country,
          "jobCategory": jobCategory,
          "skills": skills,
          "experience": experience,
          "expectedSalary": salary,
          "videoUrl": videoUrl ?? "",
        }),
      );

      debugPrint(
          'Create candidate response: ${response.statusCode} ${response.body}');
      final data = jsonDecode(response.body);

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          data['success'] == true) {
        return true;
      } else {
        throw Exception(data["error"] ?? "Failed to create candidate");
      }
    } catch (e) {
      throw Exception("Candidate upload failed: $e");
    }
  }

  /// ✅ FETCH CANDIDATES (MARKETPLACE)
  static Future<List<Map<String, dynamic>>> getCandidates() async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/api/candidates/deployed"),
      );

      debugPrint(
          'Fetch candidates response: ${response.statusCode} ${response.body}');
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      } else {
        throw Exception("Failed to fetch candidates");
      }
    } catch (e) {
      throw Exception("Error fetching candidates: $e");
    }
  }
}
