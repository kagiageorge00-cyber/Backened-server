import 'package:cloud_firestore/cloud_firestore.dart';

class SupportTicketModel {
  final String ticketId;
  final String createdBy;
  final String role;
  final String message;
  final String status; // open / closed / pending
  final String adminResponse;
  final Timestamp createdAt;
  final Timestamp updatedAt;

  SupportTicketModel({
    required this.ticketId,
    required this.createdBy,
    required this.role,
    required this.message,
    required this.status,
    required this.adminResponse,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SupportTicketModel.fromMap(Map<String, dynamic> data, String id) {
    return SupportTicketModel(
      ticketId: id,
      createdBy: data['createdBy'] ?? '',
      role: data['role'] ?? '',
      message: data['message'] ?? '',
      status: data['status'] ?? 'open',
      adminResponse: data['adminResponse'] ?? '',
      createdAt: data['createdAt'] ?? Timestamp.now(),
      updatedAt: data['updatedAt'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'createdBy': createdBy,
      'role': role,
      'message': message,
      'status': status,
      'adminResponse': adminResponse,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
