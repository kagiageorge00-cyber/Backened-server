import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class BackendApplicationService {
  static final String _base = AppConfig.backendUrl;

  static Future<Map<String, dynamic>?> getApplication(
      String candidateId) async {
    try {
      final res = await http.get(
        Uri.parse('$_base/applications/$candidateId'),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['data'];
      }

      return null;
    } catch (e) {
      return null;
    }
  }
}
