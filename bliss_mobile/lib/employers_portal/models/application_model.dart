import 'package:cloud_firestore/cloud_firestore.dart';

class ApplicationModel {
  final String id;
  final String candidateId;
  final String candidateName;
  final String jobId;
  final String jobTitle;
  final String employerId;
  final String employerName;

  // Application status
  final bool applicationPaid; // Did candidate pay registration / application fee?
  final DateTime applicationDate;
  final String applicationStatus; // Pending, Submitted, Reviewed, Rejected

  // Interview
  final bool interviewScheduled;
  final DateTime? interviewDate;
  final String interviewStatus; // Pending, Passed, Failed

  // Hire
  final bool isHired;
  final bool hireFeesPaid;
  final DateTime? hireDate;

  // Candidate documents (unlocked only after hire fees are paid)
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

  // Convert Firestore document to ApplicationModel
  factory ApplicationModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ApplicationModel(
      id: doc.id,
      candidateId: data['candidateId'] ?? '',
      candidateName: data['candidateName'] ?? '',
      jobId: data['jobId'] ?? '',
      jobTitle: data['jobTitle'] ?? '',
      employerId: data['employerId'] ?? '',
      employerName: data['employerName'] ?? '',
      applicationPaid: data['applicationPaid'] ?? false,
      applicationDate: (data['applicationDate'] as Timestamp).toDate(),
      applicationStatus: data['applicationStatus'] ?? 'Pending',
      interviewScheduled: data['interviewScheduled'] ?? false,
      interviewDate: data['interviewDate'] != null
          ? (data['interviewDate'] as Timestamp).toDate()
          : null,
      interviewStatus: data['interviewStatus'] ?? 'Pending',
      isHired: data['isHired'] ?? false,
      hireFeesPaid: data['hireFeesPaid'] ?? false,
      hireDate: data['hireDate'] != null
          ? (data['hireDate'] as Timestamp).toDate()
          : null,
      documents: Map<String, String>.from(data['documents'] ?? {}),
    );
  }

  // Convert ApplicationModel to Map<String, dynamic> for Firestore
  Map<String, dynamic> toMap() {
    return {
      'candidateId': candidateId,
      'candidateName': candidateName,
      'jobId': jobId,
      'jobTitle': jobTitle,
      'employerId': employerId,
      'employerName': employerName,
      'applicationPaid': applicationPaid,
      'applicationDate': Timestamp.fromDate(applicationDate),
      'applicationStatus': applicationStatus,
      'interviewScheduled': interviewScheduled,
      'interviewDate': interviewDate != null ? Timestamp.fromDate(interviewDate!) : null,
      'interviewStatus': interviewStatus,
      'isHired': isHired,
      'hireFeesPaid': hireFeesPaid,
      'hireDate': hireDate != null ? Timestamp.fromDate(hireDate!) : null,
      'documents': documents,
    };
  }
}
