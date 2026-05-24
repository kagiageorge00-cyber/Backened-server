import 'package:cloud_firestore/cloud_firestore.dart';

class NotificationModel {
  final String id;
  final String userId;
  final String role;
  final String message;
  final String link;
  final bool isRead;
  final Timestamp timestamp;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.role,
    required this.message,
    required this.link,
    required this.isRead,
    required this.timestamp,
  });

  factory NotificationModel.fromMap(Map<String, dynamic> data, String id) {
    return NotificationModel(
      id: id,
      userId: data['userId'] ?? '',
      role: data['role'] ?? '',
      message: data['message'] ?? '',
      link: data['link'] ?? '',
      isRead: data['isRead'] ?? false,
      timestamp: data['timestamp'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'role': role,
      'message': message,
      'link': link,
      'isRead': isRead,
      'timestamp': timestamp,
    };
  }
}
