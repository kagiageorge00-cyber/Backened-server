import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:bliss_mobile/config/app_config.dart';
import 'package:bliss_mobile/agents_portal/models/agent_model.dart';

class BackendAgentService {
  static final String _base = AppConfig.backendUrl;

  // ------------------------
  // Fetch agent by ID
  // ------------------------
  static Future<AgentModel?> getAgentById(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$_base/api/agents/$id'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['success'] == true && data['data'] != null) {
          return AgentModel.fromMap(data['data'], id);
        }
      }

      return null;
    } catch (e) {
      print('Error fetching agent: $e');
      return null;
    }
  }

  // ------------------------
  // Update agent
  // ------------------------
  static Future<bool> updateAgent(AgentModel agent) async {
    try {
      final response = await http.put(
        Uri.parse('$_base/api/agents/${agent.agentId}'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(agent.toMap()),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating agent: $e');
      return false;
    }
  }
}
