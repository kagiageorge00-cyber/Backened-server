import 'session_service.dart';

class BackendAuth {
  static String? userId;
  static String? token;
  static DateTime? tokenExpiry;

  /// Set session and persist
  static Future<void> setSession({
    required String id,
    String? authToken,
    DateTime? expiry,
  }) async {
    userId = id;
    token = authToken;
    tokenExpiry = expiry;
    if (authToken != null && expiry != null) {
      await SessionService.saveSession(
          userId: id, token: authToken, expiry: expiry);
    }
  }

  /// Load session from storage
  static Future<bool> loadSession() async {
    final session = await SessionService.loadSession();
    if (session == null) return false;
    userId = session['userId'];
    token = session['token'];
    tokenExpiry = session['expiry'];
    return isAuthenticated && !isTokenExpired;
  }

  /// Clear session and storage
  static Future<void> clear() async {
    userId = null;
    token = null;
    tokenExpiry = null;
    await SessionService.clearSession();
  }

  static bool get isAuthenticated =>
      userId != null && token != null && !isTokenExpired;

  static bool get isTokenExpired {
    if (tokenExpiry == null) return true;
    return DateTime.now().isAfter(tokenExpiry!);
  }

  /// Call this after login or token refresh
  static Future<void> refreshToken(String newToken, DateTime newExpiry) async {
    token = newToken;
    tokenExpiry = newExpiry;
    if (userId != null) {
      await SessionService.saveSession(
          userId: userId!, token: newToken, expiry: newExpiry);
    }
  }
}
