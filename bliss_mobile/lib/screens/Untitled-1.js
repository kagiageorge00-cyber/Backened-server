import 'package:http/http.dart' as http;
import 'dart:convert';

final response = await http.post(
  Uri.parse('https://your-backend-url.com/api/payments'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'amount': amount,
    'createdAt': DateTime.now().toUtc().toIso8601String(),
  }),
);