import 'package:bliss_mobile/firebase_stub.dart';

class ApplicationModel {
  final String id;
  final String candidateId;
  final String candidateName;
  final String jobId;
  final String jobTitle;
  final String employerId;
  final String employerName;

  // Application status
  final bool applicationPaid;
  final DateTime applicationDate;
  final String applicationStatus;

  // Interview
  final bool interviewScheduled;
  final DateTime? interviewDate;
  final String interviewStatus;

  // Hire
  final bool isHired;
  final bool hireFeesPaid;
  final DateTime? hireDate;

  // Documents
  final Map<String, String> documents;

  ApplicationModel({
    required this.id,
    required this.candidateId,
    required this.candidateName,
    required this.jobId,
    required this.jobTitle,
    required this.employerId,
    required this.employerName,
    this.applicationPaid = false,
    required this.applicationDate,
    this.applicationStatus = 'Pending',
    this.interviewScheduled = false,
    this.interviewDate,
    this.interviewStatus = 'Pending',
    this.isHired = false,
    this.hireFeesPaid = false,
    this.hireDate,
    this.documents = const {},
  });

  // ✅ FROM BACKEND (JSON)
  factory ApplicationModel.fromMap(Map<String, dynamic> data, String id) {
    return ApplicationModel(
      id: id,
      candidateId: data['candidateId'] ?? '',
      candidateName: data['candidateName'] ?? '',
      jobId: data['jobId'] ?? '',
      jobTitle: data['jobTitle'] ?? '',
      employerId: data['employerId'] ?? '',
      employerName: data['employerName'] ?? '',
      applicationPaid: data['applicationPaid'] ?? false,
      applicationDate:
          DateTime.tryParse(data['applicationDate'] ?? '') ?? DateTime.now(),
      applicationStatus: data['applicationStatus'] ?? 'Pending',
      interviewScheduled: data['interviewScheduled'] ?? false,
      interviewDate: data['interviewDate'] != null
          ? DateTime.tryParse(data['interviewDate'])
          : null,
      interviewStatus: data['interviewStatus'] ?? 'Pending',
      isHired: data['isHired'] ?? false,
      hireFeesPaid: data['hireFeesPaid'] ?? false,
      hireDate:
          data['hireDate'] != null ? DateTime.tryParse(data['hireDate']) : null,
      documents: Map<String, String>.from(data['documents'] ?? {}),
    );
  }

  factory ApplicationModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return ApplicationModel.fromMap(data, doc.id);
  }

  // ✅ TO BACKEND (JSON)
  Map<String, dynamic> toMap() {
    return {
      'candidateId': candidateId,
      'candidateName': candidateName,
      'jobId': jobId,
      'jobTitle': jobTitle,
      'employerId': employerId,
      'employerName': employerName,
      'applicationPaid': applicationPaid,
      'applicationDate': applicationDate.toIso8601String(),
      'applicationStatus': applicationStatus,
      'interviewScheduled': interviewScheduled,
      'interviewDate': interviewDate?.toIso8601String(),
      'interviewStatus': interviewStatus,
      'isHired': isHired,
      'hireFeesPaid': hireFeesPaid,
      'hireDate': hireDate?.toIso8601String(),
      'documents': documents,
    };
  }
}
