// lib/employers_portal/models/interview_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class Interview {
  String id; // mutable for Firestore doc ID assignment
  final String candidateId;
  final String candidateName;
  final String jobId;
  final String jobTitle;
  final String employerId;
  final String employerName;

  final DateTime scheduledDate;
  final String scheduledTime; // e.g., "14:00 - 15:00"
  String status; // Pending, Completed, Passed, Failed
  final String? feedback;
  final String? videoCallLink;

  Interview({
    this.id = '',
    required this.candidateId,
    required this.candidateName,
    required this.jobId,
    required this.jobTitle,
    required this.employerId,
    required this.employerName,
    required this.scheduledDate,
    required this.scheduledTime,
    this.status = 'Pending',
    this.feedback,
    this.videoCallLink,
  });

  /// Convert Firestore Map → Interview
  factory Interview.fromMap(Map<String, dynamic> map) {
    return Interview(
      id: map['id'] ?? '',
      candidateId: map['candidateId'] ?? '',
      candidateName: map['candidateName'] ?? '',
      jobId: map['jobId'] ?? '',
      jobTitle: map['jobTitle'] ?? '',
      employerId: map['employerId'] ?? '',
      employerName: map['employerName'] ?? '',
      scheduledDate: map['scheduledDate'] != null
          ? (map['scheduledDate'] as Timestamp).toDate()
          : DateTime.now(),
      scheduledTime: map['scheduledTime'] ?? '',
      status: map['status'] ?? 'Pending',
      feedback: map['feedback'],
      videoCallLink: map['videoCallLink'],
    );
  }

  /// Convert Interview → Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'candidateId': candidateId,
      'candidateName': candidateName,
      'jobId': jobId,
      'jobTitle': jobTitle,
      'employerId': employerId,
      'employerName': employerName,
      'scheduledDate': Timestamp.fromDate(scheduledDate),
      'scheduledTime': scheduledTime,
      'status': status,
      'feedback': feedback,
      'videoCallLink': videoCallLink,
    };
  }

  /// Clone with updates
  Interview copyWith({
    String? candidateId,
    String? candidateName,
    String? jobId,
    String? jobTitle,
    String? employerId,
    String? employerName,
    DateTime? scheduledDate,
    String? scheduledTime,
    String? status,
    String? feedback,
    String? videoCallLink,
  }) {
    return Interview(
      id: id,
      candidateId: candidateId ?? this.candidateId,
      candidateName: candidateName ?? this.candidateName,
      jobId: jobId ?? this.jobId,
      jobTitle: jobTitle ?? this.jobTitle,
      employerId: employerId ?? this.employerId,
      employerName: employerName ?? this.employerName,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      status: status ?? this.status,
      feedback: feedback ?? this.feedback,
      videoCallLink: videoCallLink ?? this.videoCallLink,
    );
  }
}
