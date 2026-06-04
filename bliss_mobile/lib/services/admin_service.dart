import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class AdminService {
  static final String base = AppConfig.backendUrl;
  static String? _adminToken;

  static const headers = {
    'Content-Type': 'application/json',
  };

  // ======================
  // GET AUTH HEADERS
  // ======================
  static Map<String, String> get authHeaders {
    final Map<String, String> h = {...headers};
    if (_adminToken != null) {
      h['Authorization'] = 'Bearer $_adminToken';
    }
    return h;
  }

  // ======================
  // ADMIN LOGIN
  // ======================
  static Future<bool> adminLogin(String username, String password) async {
    try {
      final url = '$base/api/admin/login';
      print("🔐 Admin Login: $username");

      final res = await http.post(
        Uri.parse(url),
        headers: headers,
        body: jsonEncode({
          "username": username,
          "password": password,
        }),
      );

      print("📡 Status: ${res.statusCode}");
      print("📦 Body: ${res.body}");

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] && data['token'] != null) {
          _adminToken = data['token'];
          print(
              "✅ Admin login successful. Token: ${_adminToken?.substring(0, 10)}...");
          return true;
        }
      }

      return false;
    } catch (e) {
      print("❌ Admin login error: $e");
      return false;
    }
  }

  // ======================
  // ADMIN LOGOUT
  // ======================
  static Future<void> adminLogout() async {
    try {
      final url = '$base/api/admin/logout';
      await http.post(
        Uri.parse(url),
        headers: authHeaders,
      );
      _adminToken = null;
      print("✅ Admin logged out");
    } catch (e) {
      print("⚠️ Logout error: $e");
      _adminToken = null;
    }
  }

  // ======================
  // CHECK IF LOGGED IN
  // ======================
  static bool isLoggedIn() {
    return _adminToken != null;
  }

  // ======================
  // GET ALL CANDIDATES
  // ======================
  static Future<List> getCandidates() async {
    try {
      final url = '$base/api/admin/candidates';
      print("🌍 GET: $url");

      final res = await http.get(Uri.parse(url), headers: authHeaders);

      print("📡 Status: ${res.statusCode}");
      print("📦 Body: ${res.body}");

      if (res.statusCode == 401) {
        print("❌ Unauthorized - Token expired");
        _adminToken = null;
        return [];
      }

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);

        if (data is Map && data['data'] != null) {
          return List.from(data['data']);
        }
      }

      return [];
    } catch (e) {
      print("❌ getCandidates error: $e");
      return [];
    }
  }

  // ======================
  // GET PENDING PAYMENTS
  // ======================
  static Future<List> getPendingPayments() async {
    try {
      final url = '$base/api/admin/payments/pending';
      print("🌍 GET: $url");

      final res = await http.get(Uri.parse(url), headers: authHeaders);

      print("📡 Status: ${res.statusCode}");
      print("📦 Body: ${res.body}");

      if (res.statusCode == 401) {
        print("❌ Unauthorized - Token expired");
        _adminToken = null;
        return [];
      }

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data is Map && data['data'] != null) {
          return List.from(data['data']);
        }
      }

      return [];
    } catch (e) {
      print('❌ getPendingPayments error: $e');
      return [];
    }
  }

  // ======================
  // APPROVE PAYMENT (🔥 FIXED)
  // ======================
  static Future<bool> approvePayment(String paymentId) async {
    try {
      final url = '$base/api/admin/payments/$paymentId/approve';

      print("🚀 APPROVE REQUEST:");
      print("👉 URL: $url");
      print("👉 ID: $paymentId");

      final res = await http.post(
        Uri.parse(url),
        headers: authHeaders,
      );

      print("📡 Status: ${res.statusCode}");
      print("📦 Body: ${res.body}");

      if (res.statusCode == 401) {
        print("❌ Unauthorized - Token expired");
        _adminToken = null;
        return false;
      }

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      print('❌ approvePayment error: $e');
      return false;
    }
  }

  // ======================
  // VERIFY USER
  // ======================
  static Future<bool> verifyUser(String phone) async {
    try {
      final url = '$base/api/admin/verify-user';

      final res = await http.post(
        Uri.parse(url),
        headers: authHeaders,
        body: jsonEncode({"phone": phone}),
      );

      print("📡 verifyUser: ${res.statusCode} ${res.body}");

      if (res.statusCode == 401) {
        _adminToken = null;
        return false;
      }

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      print("❌ verifyUser error: $e");
      return false;
    }
  }

  // ======================
  // UPDATE STATUS
  // ======================
  static Future<bool> updateStatus(String phone, String status) async {
    try {
      final url = '$base/api/admin/status';

      final res = await http.post(
        Uri.parse(url),
        headers: authHeaders,
        body: jsonEncode({
          "phone": phone,
          "status": status,
        }),
      );

      print("📡 updateStatus: ${res.statusCode} ${res.body}");

      if (res.statusCode == 401) {
        _adminToken = null;
        return false;
      }

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      print("❌ updateStatus error: $e");
      return false;
    }
  }
}
