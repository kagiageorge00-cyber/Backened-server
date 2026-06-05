import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class BackendRegisterResult {
  final bool success;
  final String? id;
  final String? code;
  final String? error;
  final String? expiry;
  final dynamic data;

  BackendRegisterResult({
    required this.success,
    this.id,
    this.code,
    this.error,
    this.expiry,
    this.data,
  });
}

class BackendRegisterService {
  // ================= LOGIN WITH ID =================
  static Future<BackendRegisterResult> loginWithId({
    required String candidateId,
    required String password,
  }) async {
    try {
      final resp = await http.post(
        Uri.parse('$_base/login-id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'candidateId': candidateId,
          'password': password,
        }),
      );
      final data = jsonDecode(resp.body);
      if (resp.statusCode == 200 && data['success'] == true) {
        return BackendRegisterResult(
          success: true,
          id: data['user']?['_id']?.toString(),
          code: data['token'],
          expiry: data['expiry'],
          data: data['user'],
        );
      }
      return BackendRegisterResult(
        success: false,
        error: data['error'] ?? 'login_failed',
      );
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  // ================= REGISTER CANDIDATE =================
  static Future<BackendRegisterResult> registerCandidate({
    required String name,
    required String phone,
    required String email,
    required String country,
    required String skills,
    required String experience,
    required String photoUrl,
  }) async {
    try {
      final body = {
        'name': name,
        'phone': phone,
        'email': email,
        'country': country,
        'skills': skills,
        'experience': experience,
        'photoUrl': photoUrl,
      };
      final resp = await http.post(
        Uri.parse('$_base/register-candidate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      final data = jsonDecode(resp.body);
      if ((resp.statusCode == 200 || resp.statusCode == 201) &&
          data['success'] == true) {
        return BackendRegisterResult(
          success: true,
          id: data['user']?['_id']?.toString(),
          code: data['token'],
          expiry: data['expiry'],
          data: data['user'],
        );
      }
      return BackendRegisterResult(
        success: false,
        error: data['error'] ?? 'register_failed',
      );
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  // ================= VERIFY PAYMENT =================
  static Future<bool> verifyPayment(String phone) async {
    try {
      final resp = await http.post(
        Uri.parse('$_base/verify-payment'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      );
      final data = jsonDecode(resp.body);
      return resp.statusCode == 200 && data['verified'] == true;
    } catch (e) {
      return false;
    }
  }

  static final String _base = AppConfig.backendUrl;

  // ================= REGISTER =================
  static Future<BackendRegisterResult> register({
    required String name,
    required String phone,
    required String userType,
    String? email,
    String? password,
    Map<String, dynamic>? extra,
  }) async {
    try {
      final body = {
        'name': name,
        'phone': phone,
        'userType': userType,
        if (email != null) 'email': email,
        if (password != null) 'password': password,
        if (extra != null) ...extra,
      };

      final resp = await http.post(
        Uri.parse('$_base/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      final data = jsonDecode(resp.body);

      if ((resp.statusCode == 200 || resp.statusCode == 201) &&
          data['success'] == true) {
        return BackendRegisterResult(
          success: true,
          id: data['user']?['_id']?.toString(), // ✅ FIXED
          code: data['token'], // optional
          expiry: data['expiry'],
        );
      }

      return BackendRegisterResult(
        success: false,
        error: data['error'] ?? 'register_failed',
      );
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  // ================= LOGIN =================
  static Future<BackendRegisterResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final resp = await http.post(
        Uri.parse('$_base/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(resp.body);

      if (resp.statusCode == 200 && data['success'] == true) {
        return BackendRegisterResult(
          success: true,
          id: data['user']?['_id']?.toString(), // ✅ FIXED
          code: data['token'], // optional
          expiry: data['expiry'],
          data: data['user'],
        );
      }

      return BackendRegisterResult(
        success: false,
        error: data['error'] ?? 'login_failed',
      );
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  // ================= GET USER =================
  static Future<BackendRegisterResult> getUserById(String id) async {
    try {
      final resp = await http.get(
        Uri.parse('$_base/users/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      final data = jsonDecode(resp.body);

      if (resp.statusCode == 200 && data['success'] == true) {
        return BackendRegisterResult(
          success: true,
          data: data['user'] ?? data['data'], // ✅ flexible
        );
      }

      return BackendRegisterResult(
        success: false,
        error: data['error'] ?? 'user_not_found',
      );
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  // ================= UPDATE ROLE =================
  static Future<void> updateUserRole({
    required String userId,
    required String newRole,
  }) async {
    await http.put(
      Uri.parse('$_base/users/$userId/role'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'role': newRole}),
    );
  }

  // ================= VERIFY KYC =================
  static Future<void> verifyKYC({
    required String userId,
  }) async {
    await http.put(
      Uri.parse('$_base/users/$userId/kyc'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'kycVerified': true}),
    );
  }

  // ================= GET USERS BY ROLE =================
  static Future<BackendRegisterResult> getUsersByRole(String role) async {
    try {
      final resp = await http.get(
        Uri.parse('$_base/users?role=$role'),
        headers: {'Content-Type': 'application/json'},
      );

      final data = jsonDecode(resp.body);

      if (resp.statusCode == 200 && data['success'] == true) {
        return BackendRegisterResult(
          success: true,
          data: data['users'] ?? data['data'], // ✅ flexible
        );
      }

      return BackendRegisterResult(
        success: false,
        error: data['error'] ?? 'fetch_failed',
      );
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  // ================= DELETE USER =================
  static Future<void> deleteUser({
    required String userId,
  }) async {
    await http.delete(
      Uri.parse('$_base/users/$userId'),
      headers: {'Content-Type': 'application/json'},
    );
  }
}
