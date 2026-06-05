import '../../services/backend_register_service.dart';
import 'backend_agent_service.dart';
import 'package:flutter/foundation.dart';
import '../../services/backend_auth.dart';
import '../models/agent_model.dart';

class AuthService {
  // ------------------------
  // REGISTER AGENT
  // ------------------------
  Future<AgentModel?> registerAgent({
    required String fullName,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      final res = await BackendRegisterService.register(
        name: fullName,
        email: email,
        phone: phone,
        password: password,
        userType: 'agent', // ✅ REQUIRED FIX
      );

      if (!res.success || res.id == null) {
        debugPrint('Backend registration failed: ${res.error}');
        return null;
      }

      final agent = AgentModel(
        agentId: res.id.toString(),
        fullName: fullName,
        email: email,
        phone: phone,
        subscriptionActive: false,
        subscriptionEnd: DateTime.now(),
        createdAt: DateTime.now(),
      );

      // Save session
      BackendAuth.setSession(id: res.id.toString());

      return agent;
    } catch (e) {
      debugPrint('Error registering agent: $e');
      return null;
    }
  }

  // ------------------------
  // LOGIN AGENT
  // ------------------------
  Future<AgentModel?> loginAgent({
    required String email,
    required String password,
  }) async {
    try {
      final res = await BackendRegisterService.login(
        email: email,
        password: password,
      );

      if (!res.success || res.id == null) return null;

      final backendId = res.id.toString();

      // Save session
      BackendAuth.setSession(
        id: backendId,
        authToken: res.code,
      );

      // Fetch agent from backend
      return await BackendAgentService.getAgentById(backendId);
    } catch (e) {
      debugPrint('Error logging in agent: $e');
      return null;
    }
  }

  // ------------------------
  // GET CURRENT AGENT
  // ------------------------
  Future<AgentModel?> getCurrentAgent() async {
    try {
      final currentUserId = BackendAuth.userId;
      if (currentUserId == null) return null;

      return await BackendAgentService.getAgentById(currentUserId);
    } catch (e) {
      debugPrint('Error fetching current agent: $e');
      return null;
    }
  }

  // ------------------------
  // LOGOUT
  // ------------------------
  Future<void> logout() async {
    await BackendAuth.clear();
  }

  // ------------------------
  // RESET PASSWORD (placeholder)
  // ------------------------
  Future<bool> resetPassword({required String email}) async {
    try {
      // TODO: connect to backend later
      return true;
    } catch (e) {
      debugPrint('Error resetting password: $e');
      return false;
    }
  }

  // ------------------------
  // UPDATE PROFILE (placeholder)
  // ------------------------
  Future<bool> updateAgentProfile(AgentModel agent) async {
    try {
      // TODO: connect to backend
      return true;
    } catch (e) {
      debugPrint('Error updating agent profile: $e');
      return false;
    }
  }
}
