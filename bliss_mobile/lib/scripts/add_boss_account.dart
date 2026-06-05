import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:bliss_mobile/config/app_config.dart';

class BossAccountService {
  static final String _base = AppConfig.backendUrl;

  // ------------------------
  // Create Boss Account
  // ------------------------
  static Future<bool> addBossAccount() async {
    try {
      final response = await http.post(
        Uri.parse('$_base/staff/create'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "username": "boss",
          "password": "boss123",
          "name": "Boss",
          "role": "admin",
          "email": "boss@bliss.com",
          "permissions": ["all"],
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('Boss account added successfully');
        return true;
      } else {
        print('Failed: ${response.body}');
        return false;
      }
    } catch (e) {
      print('Error adding boss account: $e');
      return false;
    }
  }

  // ------------------------
  // Ensure Boss Exists
  // ------------------------
  static Future<void> initializeBossAccount() async {
    try {
      final response = await http.get(
        Uri.parse('$_base/staff/boss001'),
      );

      if (response.statusCode == 404) {
        await addBossAccount();
      } else {
        print('Boss already exists');
      }
    } catch (e) {
      print('Error checking boss account: $e');
    }
  }
}
