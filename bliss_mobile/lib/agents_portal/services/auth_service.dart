import '../../services/backend_register_service.dart';
import 'backend_agent_service.dart';
import 'package:flutter/foundation.dart';
import '../../services/backend_auth.dart';
import '../models/agent_model.dart';

class AuthService {
  final String agentCollection = 'agents';

  // ------------------------
  // Register a new agent
  // ------------------------
  Future<AgentModel?> registerAgent({
    required String fullName,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      // Register via backend
      final res = await BackendRegisterService.register(
          name: fullName, email: email, extra: {'phone': phone});
      if (!res.success || res.id == null) {
        debugPrint('Backend registration failed: ${res.error}');
        return null;
      }
      final agentId = res.id!.toString();
      final agent = AgentModel(
        agentId: agentId,
        fullName: fullName,
        email: email,
        phone: phone,
        subscriptionActive: false,
        subscriptionEnd: DateTime.now(),
        createdAt: DateTime.now(),
      );

      final Map<String, dynamic> data = agent.toMap();
      data['backendId'] = agentId;

      // TODO: Replace with backend registration logic
      BackendAuth.setSession(id: agentId);
      return agent;
    } catch (e) {
      debugPrint('Error registering agent: $e');
      return null;
    }
  }

  // ------------------------
  // Agent login
  // ------------------------
  Future<AgentModel?> loginAgent(
      {required String email, required String password}) async {
    try {
      final res =
          await BackendRegisterService.login(email: email, password: password);
      if (!res.success || res.id == null) return null;

      final backendId = res.id!.toString();
      BackendAuth.setSession(id: backendId, authToken: res.code);
      // Fetch agent profile from backend
      final agent = await BackendAgentService.getAgentById(backendId);
      return agent;
    } catch (e) {
      debugPrint('Error logging in agent: $e');
      return null;
    }
  }

  // ------------------------
  // Logout agent
  // ------------------------
  Future<void> logout() async {
    await BackendAuth.clear();
  }

  // Get current logged-in agent from backend
  Future<AgentModel?> getCurrentAgent() async {
    final currentUserId = BackendAuth.userId;
    if (currentUserId == null) return null;
    return await BackendAgentService.getAgentById(currentUserId);
  }

  // ------------------------
  // Reset Password
  // ------------------------
  Future<bool> resetPassword({required String email}) async {
    try {
      // TODO: Implement password reset logic for backend
      return true;
    } catch (e) {
      debugPrint('Error resetting password: $e');
      return false;
    }
  }

  // ------------------------
  // Get current logged-in agent
  // ------------------------
  Future<AgentModel?> getCurrentAgent() async {
    final currentUserId = BackendAuth.userId;
    if (currentUserId == null) return null;

    // TODO: Replace with backend get current agent logic using currentUserId
    return null;
  }

  // ------------------------
  // Update agent profile
  // ------------------------
  Future<bool> updateAgentProfile(AgentModel agent) async {
    try {
      // TODO: Replace with backend update agent profile logic
      return true;
    } catch (e) {
      debugPrint('Error updating agent profile: $e');
      return false;
    }
  }
}
