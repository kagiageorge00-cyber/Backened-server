import 'package:shared_preferences/shared_preferences.dart';

class SessionService {
  static const _userIdKey = 'userId';
  static const _tokenKey = 'authToken';
  static const _tokenExpiryKey = 'tokenExpiry';

  /// Save session data securely
  static Future<void> saveSession({
    required String userId,
    required String token,
    required DateTime expiry,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_tokenExpiryKey, expiry.toIso8601String());
  }

  /// Load session data
  static Future<Map<String, dynamic>?> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString(_userIdKey);
    final token = prefs.getString(_tokenKey);
    final expiryStr = prefs.getString(_tokenExpiryKey);
    if (userId == null || token == null || expiryStr == null) return null;
    final expiry = DateTime.tryParse(expiryStr);
    if (expiry == null) return null;
    return {
      'userId': userId,
      'token': token,
      'expiry': expiry,
    };
  }

  /// Clear session data
  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userIdKey);
    await prefs.remove(_tokenKey);
    await prefs.remove(_tokenExpiryKey);
  }
}
