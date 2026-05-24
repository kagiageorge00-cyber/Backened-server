import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

Future<void> registerUser(String name, String email) async {
  try {
    final response = await http
        .post(
          Uri.parse('${AppConfig.backendUrl}/register'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'name': name,
            'email': email,
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        print('✅ Registration successful: $data');
      } else {
        print('❌ Registration failed: ${data['message'] ?? data['error']}');
      }
    } else {
      print('❌ Network error: ${response.statusCode}');
    }
  } catch (e) {
    print('❌ Error: $e');
  }
}
