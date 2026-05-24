import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// Service to manage travel document bookings and payments
class TravelDocumentService {
  // final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Create a travel document booking with payment
  Future<String> createTravelDocumentBooking({
    required String candidateId,
    required String candidateName,
    required String phoneNumber,
    required String documentType, // 'passport', 'medical', 'invitation', 'work_permit', 'birth_certificate'
    required double amount,
    required String paymentMethod, // 'mpesa', 'flutterwave', 'paypal'
    required String transactionId,
    String? country,
  }) async {
    final bookingRef = _db.collection('travel_document_bookings').doc();
    
    final bookingData = {
      'id': bookingRef.id,
      'candidateId': candidateId,
      'candidateName': candidateName,
      'phoneNumber': phoneNumber,
      'documentType': documentType,
      // Replace with HTTP POST to backend endpoint
      // Example endpoint: /api/travel-document-bookings
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/travel-document-bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'candidateId': candidateId,
          'candidateName': candidateName,
          'phoneNumber': phoneNumber,
          'documentType': documentType,
          'country': country,
          'amount': amount,
          'paymentMethod': paymentMethod,
          'transactionId': transactionId,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data['id'] ?? '';
      } else {
        throw Exception('Failed to create travel document booking');
      }
        .get();

    return snapshot.docs.map((doc) => doc.data()).toList();
  }
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/travel-document-bookings/list'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'candidateId': candidateId}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['bookings'] ?? []);
      } else {
        throw Exception('Failed to fetch bookings');
      }
  }

  /// Get booking details
  Future<Map<String, dynamic>?> getBookingDetails(String bookingId) async {
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/travel-document-bookings/update-status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'bookingId': bookingId, 'status': newStatus}),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to update booking status');
      }
  /// Generate booking slip/receipt
  Future<Map<String, dynamic>> generateBookingReceipt(String bookingId) async {
    final booking = await getBookingDetails(bookingId);
    
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/travel-document-bookings/details'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'bookingId': bookingId}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['booking'];
      } else {
        return null;
      }
    }

    return {
      'bookingId': bookingId,
      final booking = await getBookingDetails(bookingId);
      if (booking == null) {
        throw Exception('Booking not found');
      }
      return {
        'receiptId': 'RCP-${bookingId.substring(0, 6).toUpperCase()}',
        'candidateName': booking['candidateName'],
        'documentType': booking['documentType'],
        'amount': booking['amount'],
        'paymentMethod': booking['paymentMethod'],
        'transactionId': booking['transactionId'],
        'bookingDate': booking['bookingDate'],
        'status': booking['status'],
      };
        .orderBy('bookingDate', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }
      throw UnimplementedError('Real-time updates are not implemented in the HTTP migration.');
        .get();

    final stats = {
      'total': snapshot.docs.length,
      throw UnimplementedError('Booking statistics are not implemented in the HTTP migration.');
      if (status == 'processing') stats['processing'] = (stats['processing'] ?? 0) + 1;
