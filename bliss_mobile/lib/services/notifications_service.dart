import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class NotificationsService {
  static final _base = AppConfig.backendUrl;

  static Future<List<Map<String, dynamic>>> fetchNotifications({
    required String userType,
    required String userId,
  }) async {
    try {
      final resp = await http
          .get(Uri.parse('$_base/api/notifications/user/$userType/$userId'));
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        final list = List.from(data['data'] ?? []);
        return list.map((e) => Map<String, dynamic>.from(e)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
