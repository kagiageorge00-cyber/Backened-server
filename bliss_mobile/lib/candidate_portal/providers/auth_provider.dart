import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../repositories/auth_repository.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  static const String backendBaseUrl = 'https://backened-server-1.onrender.com';
  static const String storageTokenKey = 'candidate_token';

  final storage = const FlutterSecureStorage();
  final ApiClient api = ApiClient(backendBaseUrl);
  late final AuthRepository repository;

  CandidateUser? user;
  ThemeMode themeMode = ThemeMode.system;

  AuthProvider() {
    repository = AuthRepository(AuthService(api));
    _restoreSession();
  }

  bool get isAuthenticated => user != null;

  Future<void> _restoreSession() async {
    final token = await storage.read(key: storageTokenKey);
    if (token == null) return;
    api.setAuthToken(token);
    final currentUser = await repository.currentUser();
    if (currentUser != null) {
      user = currentUser;
      notifyListeners();
      return;
    }
    await logout();
  }

  Future<bool> login(String id, String password) async {
    final u = await repository.authenticate(id, password);
    if (u != null) {
      user = u;
      if (api.authToken != null) {
        await storage.write(key: storageTokenKey, value: api.authToken);
      }
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> changePassword(String oldPassword, String newPassword) async {
    final result = await repository.changePassword(oldPassword, newPassword);
    return result;
  }

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    final updatedUser = await repository.updateProfile(updates);
    if (updatedUser != null) {
      user = updatedUser;
      notifyListeners();
      return true;
    }
    return false;
  }

  void setThemeMode(ThemeMode mode) {
    themeMode = mode;
    notifyListeners();
  }

  Future<void> logout() async {
    user = null;
    await storage.delete(key: storageTokenKey);
    api.setAuthToken('');
    notifyListeners();
  }
}
