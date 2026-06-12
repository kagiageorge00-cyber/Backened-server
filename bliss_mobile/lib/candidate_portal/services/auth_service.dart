import '../services/api_client.dart';
import '../models/user.dart';

class AuthService {
  final ApiClient api;
  AuthService(this.api);

  Future<CandidateUser?> login(String candidateId, String password) async {
    final res = await api.post('/api/candidate_portal/auth/login',
        {'candidateId': candidateId, 'password': password});
    if (res['success'] == true && res['data'] != null) {
      if (res['token'] != null) {
        api.setAuthToken(res['token'] as String);
      }
      return CandidateUser.fromJson(res['data']);
    }
    return null;
  }

  Future<CandidateUser?> currentUser() async {
    final res = await api.get('/api/candidate_portal/auth/me');
    if (res['success'] == true && res['data'] != null) {
      return CandidateUser.fromJson(res['data']);
    }
    return null;
  }

  Future<bool> changePassword(String oldPassword, String newPassword) async {
    final res = await api.post('/api/candidate_portal/auth/change-password', {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    });
    return res['success'] == true;
  }

  Future<CandidateUser?> updateProfile(Map<String, dynamic> updates) async {
    final res = await api.put('/api/candidate_portal/auth/profile', updates);
    if (res['success'] == true && res['data'] != null) {
      return CandidateUser.fromJson(res['data']);
    }
    return null;
  }
}
