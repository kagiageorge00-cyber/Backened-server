import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

Future<void> makePayment() async {
  final response = await http.post(
    Uri.parse('${AppConfig.backendUrl}/api/payments/payment'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'userId': 1,
      'amount': 100,
    }),
  );

  print(jsonDecode(response.body));
}
