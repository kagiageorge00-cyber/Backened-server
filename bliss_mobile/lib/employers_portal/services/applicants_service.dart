// lib/employers_portal/services/applicants_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/application_model.dart';

class ApplicantsService {
  static const String baseUrl =
      'https://backend-server.onrender.com/api/applications';

  /// Get all applications for a specific employer
  Future<List<ApplicationModel>> getApplicationsByEmployer(
      String employerId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/employer/$employerId'),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['success'] == true && data['data'] is List) {
        return (data['data'] as List)
            .map((e) => ApplicationModel.fromJson(e))
            .toList();
      }
    }

    throw Exception('Failed to load employer applications');
  }

  /// Get all applications for a candidate
  Future<List<ApplicationModel>> getApplicationsByCandidate(
      String candidateId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/candidate/$candidateId'),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['success'] == true && data['data'] is List) {
        return (data['data'] as List)
            .map((e) => ApplicationModel.fromJson(e))
            .toList();
      }
    }

    throw Exception('Failed to load candidate applications');
  }

  /// Get application by ID
  Future<ApplicationModel?> getApplicationById(
      String applicationId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$applicationId'),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['success'] == true && data['data'] != null) {
        return ApplicationModel.fromJson(data['data']);
      }
    }

    return null;
  }

  /// Update application status
  Future<void> updateApplicationStatus(
      String applicationId,
      String status,
      ) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$applicationId/status'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'status': status,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update application status');
    }
  }

  /// Unlock candidate documents
  Future<void> unlockCandidateDocuments(
      String applicationId) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$applicationId/unlock-documents'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'documentsUnlocked': true,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to unlock documents');
    }
  }

  /// Return candidate to marketplace
  Future<void> returnCandidateToMarketplace(
      String applicationId) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$applicationId/return'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'status': 'returned_to_marketplace',
        'documentsUnlocked': false,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to return candidate to marketplace');
    }
  }
}