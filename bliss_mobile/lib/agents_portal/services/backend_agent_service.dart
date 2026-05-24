import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../agents_portal/models/agent_model.dart';

class BackendAgentService {
  static final String _base = AppConfig.backendUrl;

  // Fetch agent by ID
  static Future<AgentModel?> getAgentById(String id) async {
    try {
      final resp = await http.get(
        Uri.parse('$_base/agents/$id'),
        headers: {'Content-Type': 'application/json'},
      );
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        if (data['success'] == true && data['data'] != null) {
          return AgentModel.fromMap(data['data'], id);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
