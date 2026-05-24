import 'package:flutter/foundation.dart';
import '../models/user.dart';
import 'backend_auth.dart';
import 'backend_register_service.dart';
import '../models/user_role.dart';
import '../agents_portal/services/activity_log_service.dart';
import 'session_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();

  factory AuthService() {
    return _instance;
  }

  AuthService._internal();

  /// Load session on app start
  Future<bool> tryAutoLogin() async {
    final ok = await BackendAuth.loadSession();
    if (!ok) {
      await logout();
      return false;
    }
    // Optionally: validate token with backend here
    if (BackendAuth.isTokenExpired) {
      await logout();
      return false;
    }
    return true;
  }

  /// Refresh token and persist
  Future<void> refreshToken(String newToken, DateTime expiry) async {
    await BackendAuth.refreshToken(newToken, expiry);
  }

  /// Secure logout
  Future<void> logout() async {
    await BackendAuth.clear();
  }

  // Stream of current user with role (single-value stream from backend session)
  Stream<User?> get authStateChanges {
    final uid = BackendAuth.userId;
    if (uid == null) return Stream.value(null);
    return Stream.fromFuture(getUserFromBackend(uid));
  }

  // Get current user (sync - may be null)
  User? get currentUser {
    final uid = BackendAuth.userId;
    if (uid == null) return null;
    // Use getCurrentUserAsync for full data
    return null;
  }

  // Get current user async
  Future<User?> getCurrentUserAsync() async {
    final uid = BackendAuth.userId;
    if (uid == null) return null;
    return await getUserFromBackend(uid);
  }

  // Get user from backend
  Future<User?> getUserFromBackend(String uid) async {
    try {
      // Replace with your actual GET /api/users/:id endpoint
      final res = await BackendRegisterService.getUserById(uid);
      if (res.success && res.data != null) {
        return User.fromMap(res.data!, uid);
      }
      return null;
    } catch (e) {
      debugPrint('❌ Error getting user from backend: $e');
      return null;
    }
  }

  // Sign up with email and password
  Future<User?> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
    required UserRole role,
  }) async {
    try {
      // Register on backend
      final res = await BackendRegisterService.register(
          name: displayName,
          email: email,
          password: password,
          extra: {'role': role.value});
      if (!res.success || res.id == null) {
        throw Exception(res.error ?? 'register_failed');
      }

      final backendId = res.id!.toString();
      // Fetch user from backend after registration
      final user = await getUserFromBackend(backendId);
      BackendAuth.setSession(id: backendId);
      debugPrint('✅ User signed up (backend): $email');
      return user;
    } catch (e) {
      debugPrint('❌ Sign up error: $e');
      rethrow;
    }
  }

  // Login with email and password
  Future<User?> loginWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final res =
          await BackendRegisterService.login(email: email, password: password);
      if (!res.success || res.id == null) {
        throw Exception(res.error ?? 'login_failed');
      }

      final backendId = res.id!.toString();
      final user = await getUserFromBackend(backendId);
      // Assume backend returns token expiry in res.expiry (ISO string)
      final expiry = (res.expiry != null && res.expiry != '')
          ? DateTime.tryParse(res.expiry!)
          : DateTime.now().add(const Duration(hours: 2));
      await BackendAuth.setSession(
          id: backendId, authToken: res.code, expiry: expiry);
      debugPrint('✅ User logged in (backend): $email');

      // Log login activity
      if (user != null) {
        await ActivityLogService.log(
          type: 'login',
          actorId: user.uid,
          actorRole: user.role.value,
          description: 'User logged in',
          details: {'email': email},
        );
      }

      return user;
    } catch (e) {
      debugPrint('❌ Login error: $e');
      rethrow;
    }
  }

  // Update user role (admin only)
  Future<void> updateUserRole({
    required String userId,
    required UserRole newRole,
  }) async {
    try {
      // Check if current user is admin
      final currentUser = await getCurrentUserAsync();
      if (currentUser?.role != UserRole.admin) {
        throw Exception('Only admins can update user roles');
      }
      // Replace with backend update user role endpoint
      await BackendRegisterService.updateUserRole(
          userId: userId, newRole: newRole.value);
      debugPrint('✅ User role updated: $userId → ${newRole.value}');
      // Log admin action
      await ActivityLogService.log(
        type: 'admin_action',
        actorId: currentUser?.uid ?? '',
        actorRole: currentUser?.role.value ?? '',
        description: 'Updated user role',
        details: {'userId': userId, 'newRole': newRole.value},
      );
    } catch (e) {
      debugPrint('❌ Error updating user role: $e');
      rethrow;
    }
  }

  // Verify KYC (admin only)
  Future<void> verifyKYC({required String userId}) async {
    try {
      final currentUser = await getCurrentUserAsync();
      if (currentUser?.role != UserRole.admin) {
        throw Exception('Only admins can verify KYC');
      }

      await _firestore.collection('users').doc(userId).update({
        'kycVerified': true,
      });

      debugPrint('✅ KYC verified for user: $userId');

      // Log admin action
      await ActivityLogService.log(
        type: 'admin_action',
        actorId: currentUser?.uid ?? '',
        actorRole: currentUser?.role.value ?? '',
        description: 'Verified KYC for user',
        details: {'userId': userId},
      );
    } catch (e) {
      debugPrint('❌ Error verifying KYC: $e');
      rethrow;
    }
  }

  // Check if user has permission for action
  Future<bool> hasPermission(String action) async {
    final user = await getCurrentUserAsync();
    if (user == null) return false;

    switch (action) {
      case 'view_financial_dashboard':
        return user.role.isAdmin;
      case 'post_jobs':
        return user.role.isEmployer || user.role.isAdmin;
      case 'manage_candidates':
        return user.role.isAgent || user.role.isAdmin;
      case 'apply_for_jobs':
        return user.role.isCandidate;
      case 'manage_staff':
        return user.role.isStaff || user.role.isAdmin;
      default:
        return false;
    }
  }

  // Get all users with specific role (admin only)
  Future<List<User>> getUsersByRole(UserRole role) async {
    try {
      final currentUser = await getCurrentUserAsync();
      if (currentUser?.role != UserRole.admin) {
        throw Exception('Only admins can query users');
      }

      final query = await _firestore
          .collection('users')
          .where('role', isEqualTo: role.value)
          .get();

      return query.docs.map((doc) => User.fromMap(doc.data(), doc.id)).toList();
    } catch (e) {
      debugPrint('❌ Error getting users by role: $e');
      return [];
    }
  }

  // Delete account
  Future<void> deleteAccount({required String uid}) async {
    try {
      // Delete from Firestore first
      await _firestore.collection('users').doc(uid).delete();

      // Clear backend session if this was the current user
      if (BackendAuth.userId == uid) BackendAuth.clear();
      debugPrint('✅ Account deleted: $uid');
    } catch (e) {
      debugPrint('❌ Error deleting account: $e');
      rethrow;
    }
  }
}
