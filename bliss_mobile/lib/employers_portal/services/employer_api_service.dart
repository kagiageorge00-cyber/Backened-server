import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';

class EmployerAuthResult {
  final bool success;
  final String? employerId;
  final String? employerName;
  final String? companyName;
  final String? token;
  final String? expiry;
  final String? error;
  final Map<String, dynamic>? counts;

  EmployerAuthResult({
    required this.success,
    this.employerId,
    this.employerName,
    this.companyName,
    this.token,
    this.expiry,
    this.error,
    this.counts,
  });
}

class EmployerProfile {
  final String employerId;
  final String companyName;
  final String contactPerson;
  final String email;
  final String phone;
  final String country;
  final String industry;
  final String companyAddress;
  final String website;
  final String verificationStatus;

  EmployerProfile({
    required this.employerId,
    required this.companyName,
    required this.contactPerson,
    required this.email,
    required this.phone,
    required this.country,
    required this.industry,
    required this.companyAddress,
    required this.website,
    required this.verificationStatus,
  });

  factory EmployerProfile.fromMap(Map<String, dynamic> map) {
    return EmployerProfile(
      employerId: map['employerId']?.toString() ?? '',
      companyName: map['companyName']?.toString() ?? '',
      contactPerson: map['contactPerson']?.toString() ?? '',
      email: map['email']?.toString() ?? '',
      phone: map['phone']?.toString() ?? '',
      country: map['country']?.toString() ?? '',
      industry: map['industry']?.toString() ?? '',
      companyAddress: map['companyAddress']?.toString() ?? '',
      website: map['website']?.toString() ?? '',
      verificationStatus: map['verificationStatus']?.toString() ?? 'pending',
    );
  }
}

class EmployerStats {
  final int candidateNotifications;
  final int interviewRequests;
  final int messages;
  final int totalNotifications;

  EmployerStats({
    required this.candidateNotifications,
    required this.interviewRequests,
    required this.messages,
    required this.totalNotifications,
  });

  factory EmployerStats.fromMap(Map<String, dynamic> map) {
    return EmployerStats(
      candidateNotifications: map['candidateNotifications'] is int
          ? map['candidateNotifications']
          : int.tryParse(map['candidateNotifications']?.toString() ?? '0') ?? 0,
      interviewRequests: map['interviewRequests'] is int
          ? map['interviewRequests']
          : int.tryParse(map['interviewRequests']?.toString() ?? '0') ?? 0,
      messages: map['messages'] is int
          ? map['messages']
          : int.tryParse(map['messages']?.toString() ?? '0') ?? 0,
      totalNotifications: map['totalNotifications'] is int
          ? map['totalNotifications']
          : int.tryParse(map['totalNotifications']?.toString() ?? '0') ?? 0,
    );
  }
}

class EmployerApiService {
  static final String _baseUrl = '${AppConfig.backendUrl}/api/employers';

  static Future<EmployerAuthResult> loginEmployer({
    required String employerId,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'employerId': employerId, 'password': password}),
      );
      final map = jsonDecode(response.body);
      if (response.statusCode == 200 && map['success'] == true) {
        return EmployerAuthResult(
          success: true,
          employerId: map['employer']?['employerId']?.toString(),
          companyName: map['employer']?['companyName']?.toString(),
          employerName: map['employer']?['contactPerson']?.toString(),
          token: map['token']?.toString(),
          expiry: map['expiry']?.toString(),
          counts: map['counts'] as Map<String, dynamic>?,
        );
      }
      return EmployerAuthResult(
        success: false,
        error: map['error']?.toString() ?? map['message']?.toString() ?? 'Login failed',
      );
    } catch (e) {
      return EmployerAuthResult(success: false, error: e.toString());
    }
  }

  static Future<EmployerAuthResult> registerEmployer({
    required String companyName,
    required String contactPerson,
    required String email,
    required String phone,
    required String country,
    required String industry,
    required String companyAddress,
    String? website,
    String? password,
  }) async {
    try {
      final body = {
        'companyName': companyName,
        'contactPerson': contactPerson,
        'email': email,
        'phone': phone,
        'country': country,
        'industry': industry,
        'companyAddress': companyAddress,
        if (website != null && website.isNotEmpty) 'website': website,
        if (password != null && password.isNotEmpty) 'password': password,
      };
      final response = await http.post(
        Uri.parse('$_baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      final map = jsonDecode(response.body);
      if ((response.statusCode == 200 || response.statusCode == 201) && map['success'] == true) {
        return EmployerAuthResult(
          success: true,
          employerId: map['employer']?['employerId']?.toString(),
          companyName: map['employer']?['companyName']?.toString(),
          employerName: map['employer']?['contactPerson']?.toString(),
          token: map['token']?.toString(),
          expiry: map['expiry']?.toString(),
          counts: map['counts'] as Map<String, dynamic>?,
        );
      }
      return EmployerAuthResult(
        success: false,
        error: map['error']?.toString() ?? map['message']?.toString() ?? 'Registration failed',
      );
    } catch (e) {
      return EmployerAuthResult(success: false, error: e.toString());
    }
  }

  static Future<EmployerProfile?> fetchEmployerProfile(String employerId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/$employerId/profile'),
        headers: {'Content-Type': 'application/json'},
      );
      final map = jsonDecode(response.body);
      if (response.statusCode == 200 && map['success'] == true) {
        return EmployerProfile.fromMap(map['data'] as Map<String, dynamic>);
      }
    } catch (_) {}
    return null;
  }

  static Future<EmployerStats?> fetchEmployerStats(String employerId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/$employerId/stats'),
        headers: {'Content-Type': 'application/json'},
      );
      final map = jsonDecode(response.body);
      if (response.statusCode == 200 && map['success'] == true) {
        return EmployerStats.fromMap(map['data'] as Map<String, dynamic>);
      }
    } catch (_) {}
    return null;
  }

  static Future<List<Map<String, dynamic>>> fetchNotifications(String employerId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/$employerId/notifications'),
        headers: {'Content-Type': 'application/json'},
      );
      final map = jsonDecode(response.body);
      if (response.statusCode == 200 && map['success'] == true) {
        return (map['data'] as List<dynamic>)
            .map((item) => Map<String, dynamic>.from(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }
}
