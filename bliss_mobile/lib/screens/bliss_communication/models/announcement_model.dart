import 'package:cloud_firestore/cloud_firestore.dart';

class AnnouncementModel {
  final String id;
  final String title;
  final String message;
  final List<String> attachments;
  final String createdBy;
  final String targetAudience; // all / employers / candidates / staff
  final Timestamp timestamp;

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.message,
    required this.attachments,
    required this.createdBy,
    required this.targetAudience,
    required this.timestamp,
  });

  factory AnnouncementModel.fromMap(Map<String, dynamic> data, String id) {
    return AnnouncementModel(
      id: id,
      title: data['title'] ?? '',
      message: data['message'] ?? '',
      attachments: List<String>.from(data['attachments'] ?? []),
      createdBy: data['createdBy'] ?? '',
      targetAudience: data['targetAudience'] ?? 'all',
      timestamp: data['timestamp'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'message': message,
      'attachments': attachments,
      'createdBy': createdBy,
      'targetAudience': targetAudience,
      'timestamp': timestamp,
    };
  }
}
