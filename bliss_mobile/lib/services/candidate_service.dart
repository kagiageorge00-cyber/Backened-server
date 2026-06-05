import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class CandidateService {
  static const String baseUrl = ApiConfig.baseUrl;

  static Future<Map<String, dynamic>> registerCandidate({
    required String fullName,
    required String email,
    required String phone,
    required String country,
    required String skills,
    required String experience,
    required String photoUrl,
  }) async {
    try {
      debugPrint('CandidateService POST → $baseUrl/api/candidates');
      final res = await http.post(
        Uri.parse("$baseUrl/api/candidates"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "fullName": fullName,
          "email": email,
          "phone": phone,
          "country": country,
          "skills": skills,
          "experience": experience,
          "photoUrl": photoUrl,

          // 🔥 NEW LOGIC
          "isVerified": true, // after payment
          "status": "available",
        }),
      );

      debugPrint('CandidateService response: ${res.statusCode} ${res.body}');
      final data = jsonDecode(res.body);

      if (res.statusCode >= 200 &&
          res.statusCode < 300 &&
          data['success'] == true) {
        return {
          "success": true,
          "data": data['data'],
        };
      } else {
        return {
          "success": false,
          "error": data['error'] ?? "Registration failed",
        };
      }
    } catch (e) {
      return {
        "success": false,
        "error": e.toString(),
      };
    }
  }
}
