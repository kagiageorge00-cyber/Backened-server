import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class BackendRegisterResult {
  final bool success;
  final int? id;
  final String? code;
  final String? error;
  final String? expiry;

  BackendRegisterResult({
    required this.success,
    this.id,
    this.code,
    this.error,
    this.expiry,
  });
}

class BackendRegisterService {
  static final String _base = AppConfig.backendUrl;

  static Future<BackendRegisterResult> register({
    required String name,
    required String phone,
    required String userType,
    String? email,
    String? password,
    Map<String, dynamic>? extra,
  }) async {
    try {
      final Map<String, dynamic> body = {
        'name': name,
        'phone': phone,
        'userType': userType,
      };
      if (email != null && email.isNotEmpty) body['email'] = email;
      if (password != null) body['password'] = password;
      if (extra != null) body.addAll(extra);

      final resp = await http
          .post(
            Uri.parse('$_base/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 30));

      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final data = jsonDecode(resp.body);
        if (data['success'] == true) {
          return BackendRegisterResult(
            success: true,
            id: data['id'],
            code: data['code'],
            expiry: data['expiry'],
          );
        }
      }

      final data = jsonDecode(resp.body);
      return BackendRegisterResult(
          success: false, error: data['error'] ?? 'register_failed');
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  static Future<BackendRegisterResult> getUserByEmail(String email) async {
    try {
      final resp = await http
          .post(
            Uri.parse('$_base/user'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email}),
          )
          .timeout(const Duration(seconds: 30));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        if (data['success'] == true) {
          return BackendRegisterResult(
              success: true, id: data['id'], expiry: data['expiry']);
        }
      }
      final data = jsonDecode(resp.body);
      return BackendRegisterResult(
          success: false, error: data['error'] ?? 'not_found');
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }

  static Future<BackendRegisterResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final resp = await http
          .post(Uri.parse('$_base/login'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({'email': email, 'password': password}))
          .timeout(const Duration(seconds: 30));

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        if (data['success'] == true) {
          return BackendRegisterResult(
              success: true, id: data['id'], code: data['token']);
        }
      }
      final data = jsonDecode(resp.body);
      return BackendRegisterResult(
          success: false, error: data['error'] ?? 'login_failed');
    } catch (e) {
      return BackendRegisterResult(success: false, error: e.toString());
    }
  }
}
