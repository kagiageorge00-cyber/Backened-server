// services/whatsapp_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class WhatsAppService {
  static const String apiUrl = "https://graph.facebook.com/v16.0/YOUR_PHONE_NUMBER_ID/messages";
  static const String token = "YOUR_WHATSAPP_API_TOKEN";

  static Future<void> sendMessage(String phone, String message) async {
    final body = jsonEncode({
      "messaging_product": "whatsapp",
      "to": phone,
      "type": "text",
      "text": {"body": message}
    });

    final response = await http.post(
      Uri.parse(apiUrl),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: body,
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to send WhatsApp message: ${response.body}');
    }
  }

  static Future<void> sendBulkMessages(List<Map<String, String>> messages) async {
    for (var msg in messages) {
      await sendMessage(msg['phone']!, msg['message']!);
    }
  }
}
