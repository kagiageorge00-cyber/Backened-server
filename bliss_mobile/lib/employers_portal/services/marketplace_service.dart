import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/candidate_model.dart';

class MarketplaceService {
  /// Fetch candidates for employer marketplace
  Future<List<CandidateModel>> fetchCandidatesForEmployer(
      String employerId) async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/getEmployerCandidates'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"employerId": employerId}),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['candidates'] is List) {
        return (data['candidates'] as List)
            .map((c) => CandidateModel.fromJson(c))
            .toList();
      } else {
        throw Exception(
            data['error'] ?? data['message'] ?? 'Failed to load candidates');
      }
    } else {
      throw Exception('Failed to load candidates');
    }
  }

  /// Unlock candidate documents after hire fee
  Future<void> unlockCandidateDocs(
      String candidateId, String employerId) async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/unlockCandidateDocs'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        "candidateId": candidateId,
        "employerId": employerId,
      }),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    if (response.statusCode != 200) {
      throw Exception('Failed to unlock candidate docs');
    }
  }

  /// Mark candidate as deployed
  Future<void> markCandidateDeployed(String candidateId) async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/markCandidateDeployed'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        "candidateId": candidateId,
        "deploymentDate": DateTime.now().toIso8601String(),
      }),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    if (response.statusCode != 200) {
      throw Exception('Failed to mark candidate as deployed');
    }
  }
}
