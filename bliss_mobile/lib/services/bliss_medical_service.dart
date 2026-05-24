import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config/app_config.dart';

class BlissMedicalService {
  static Future<Map<String, dynamic>> bookMedical({
    required String userId,
    required String fullName,
    required String phone,
    required String idNumber,
    required String gender,
    required String dateOfBirth,
  }) async {
    final uri = Uri.parse('${AppConfig.backendUrl}/api/medical/book');
    final resp = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'fullName': fullName,
        'phone': phone,
        'idNumber': idNumber,
        'gender': gender,
        'dateOfBirth': dateOfBirth,
      }),
    );
    final data = jsonDecode(resp.body);
    if (resp.statusCode == 201 && data['success'] == true) {
      return data['booking'];
    } else {
      throw Exception(data['error'] ?? 'Booking failed');
    }
  }

  static Future<Map<String, dynamic>> submitPaymentProof({
    required String bookingId,
    String? transactionCode,
    File? proofFile,
  }) async {
    final uri = Uri.parse(
        '${AppConfig.backendUrl}/api/medical/payment-proof/$bookingId');
    final request = http.MultipartRequest('POST', uri);
    if (transactionCode != null) {
      request.fields['transactionCode'] = transactionCode;
    }
    if (proofFile != null) {
      request.files
          .add(await http.MultipartFile.fromPath('proof', proofFile.path));
    }
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['booking'];
    } else {
      throw Exception(data['error'] ?? 'Payment proof upload failed');
    }
  }

  static Future<List<dynamic>> getMyBookings(String userId) async {
    final uri = Uri.parse('${AppConfig.backendUrl}/api/medical/my/$userId');
    final resp = await http.get(uri);
    final data = jsonDecode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return data['bookings'] as List<dynamic>;
    } else {
      throw Exception(data['error'] ?? 'Failed to fetch bookings');
    }
  }

  static Future<List<dynamic>> getPendingBookings() async {
    final uri = Uri.parse('${AppConfig.backendUrl}/api/admin/medical/pending');
    final resp = await http.get(uri);
    final data = jsonDecode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return data['bookings'] as List<dynamic>;
    } else {
      throw Exception(data['error'] ?? 'Failed to fetch pending bookings');
    }
  }

  static Future<Map<String, dynamic>> verifyBooking({
    required String bookingId,
    required String action, // 'approve' or 'reject'
    String? date,
    String? time,
    String? venue,
  }) async {
    final uri = Uri.parse('${AppConfig.backendUrl}/api/admin/medical/verify');
    final resp = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'bookingId': bookingId,
        'action': action,
        'date': date,
        'time': time,
        'venue': venue,
      }),
    );
    final data = jsonDecode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return data['booking'];
    } else {
      throw Exception(data['error'] ?? 'Verification failed');
    }
  }
}
