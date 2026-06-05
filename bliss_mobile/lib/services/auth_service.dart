import '../models/user.dart';
import 'backend_auth.dart';
import 'backend_register_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // ================================
  // AUTO LOGIN
  // ================================
  Future<bool> tryAutoLogin() async {
    final ok = await BackendAuth.loadSession();

    if (!ok || BackendAuth.isTokenExpired) {
      await logout();
      return false;
    }

    return true;
  }

  // ================================
  // LOGOUT
  // ================================
  Future<void> logout() async {
    await BackendAuth.clear();
  }

  // ================================
  // CURRENT USER
  // ================================
  Future<User?> getCurrentUser() async {
    final uid = BackendAuth.userId;
    if (uid == null) return null;

    return await _getUser(uid);
  }

  // ================================
  // INTERNAL FETCH USER
  // ================================
  Future<User?> _getUser(String userId) async {
    try {
      final res = await BackendRegisterService.getUserById(userId);

      if (res.success && res.data != null) {
        return User.fromMap(res.data, userId);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  // ================================
  // LOGIN (Candidate ID + Password)
  // ================================
  Future<User> login({
    required String candidateId,
    required String password,
  }) async {
    try {
      final res = await BackendRegisterService.loginWithId(
        candidateId: candidateId,
        password: password,
      );

      if (!res.success || res.user == null) {
        throw Exception(res.error ?? "Login failed");
      }

      final userId = res.user['_id'].toString();

      // ✅ Save session
      await BackendAuth.setSession(
        id: userId,
        authToken: res.token ?? "token",
        expiry: DateTime.now().add(const Duration(days: 7)),
      );

      final user = await _getUser(userId);

      if (user == null) {
        throw Exception("Failed to load user");
      }

      return user;
    } catch (e) {
      throw Exception("Login error: $e");
    }
  }

  // ================================
  // REGISTER (AFTER PAYMENT FLOW)
  // ================================
  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    required String email,
    required String country,
    required String skills,
    required String experience,
    required String photoUrl,
  }) async {
    try {
      final res = await BackendRegisterService.registerCandidate(
        name: name,
        phone: phone,
        email: email,
        country: country,
        skills: skills,
        experience: experience,
        photoUrl: photoUrl,
      );

      if (!res.success || res.user == null) {
        throw Exception(res.error ?? "Registration failed");
      }

      final userId = res.user['_id'].toString();

      // ✅ Save session immediately
      await BackendAuth.setSession(
        id: userId,
        authToken: res.token ?? "token",
        expiry: DateTime.now().add(const Duration(days: 7)),
      );

      final user = await _getUser(userId);

      return {
        "user": user,
        "candidateId": res.candidateId,
        "password": res.password,
      };
    } catch (e) {
      throw Exception("Register error: $e");
    }
  }

  // ================================
  // VERIFY STATUS CHECK (IMPORTANT)
  // ================================
  Future<bool> isUserVerified() async {
    final user = await getCurrentUser();
    if (user == null) return false;

    // backend should return:
    // isVerified: true
    return user.isVerified == true;
  }

  // ================================
  // ADMIN: UPDATE ROLE
  // ================================
  Future<void> updateUserRole({
    required String userId,
    required String role,
  }) async {
    await BackendRegisterService.updateUserRole(
      userId: userId,
      newRole: role,
    );
  }

  // ================================
  // ADMIN: GET USERS BY ROLE
  // ================================
  Future<List<User>> getUsersByRole(String role) async {
    try {
      final res = await BackendRegisterService.getUsersByRole(role);

      if (!res.success || res.data == null) return [];

      return (res.data as List)
          .map((u) => User.fromMap(u, u['_id'].toString()))
          .toList();
    } catch (_) {
      return [];
    }
  }

  // ================================
  // DELETE ACCOUNT
  // ================================
  Future<void> deleteAccount(String userId) async {
    await BackendRegisterService.deleteUser(userId: userId);

    if (BackendAuth.userId == userId) {
      await BackendAuth.clear();
    }
  }
}
