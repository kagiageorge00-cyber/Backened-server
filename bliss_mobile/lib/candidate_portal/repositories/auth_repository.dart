import '../services/auth_service.dart';
import '../models/user.dart';

class AuthRepository {
  final AuthService service;
  AuthRepository(this.service);

  Future<CandidateUser?> authenticate(String id, String password) =>
      service.login(id, password);

  Future<CandidateUser?> currentUser() => service.currentUser();

  Future<bool> changePassword(String oldP, String newP) =>
      service.changePassword(oldP, newP);

  Future<CandidateUser?> updateProfile(Map<String, dynamic> updates) =>
      service.updateProfile(updates);
}
