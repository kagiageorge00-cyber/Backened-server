import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/employer_model.dart';

class EmployerService {
  static const String baseUrl =
      'https://your-render-backend.onrender.com/api/employers';

  /// Create Employer
  Future<void> saveEmployerProfile(Employer employer) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode(employer.toMap()),
    );

    if (response.statusCode != 200 &&
        response.statusCode != 201) {
      throw Exception(
        'Failed to save employer profile: ${response.body}',
      );
    }
  }

  /// Get Employer By ID
  Future<Employer?> fetchEmployerProfile(
    String employerId,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$employerId'),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      return Employer.fromMap(
        data,
        employerId,
      );
    }

    return null;
  }

  /// Update Employer
  Future<void> updateProfileFields(
    String employerId,
    Map<String, dynamic> data,
  ) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$employerId'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode(data),
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Failed to update profile: ${response.body}',
      );
    }
  }

  /// Delete Employer
  Future<void> deleteEmployer(
    String employerId,
  ) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/$employerId'),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Failed to delete employer: ${response.body}',
      );
    }
  }

  /// Create Default Profile
  Future<void> createDefaultProfile(
    String employerId,
    String email,
  ) async {
    final employer = Employer(
      id: employerId,
      email: email,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await saveEmployerProfile(employer);
  }

  /// Get All Employers (Admin)
  Future<List<Employer>> getAllEmployers() async {
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);

      return data.map((item) {
        return Employer.fromMap(
          item,
          item['id'].toString(),
        );
      }).toList();
    }

    throw Exception(
      'Failed to fetch employers',
    );
  }
}