// lib/employers_portal/models/candidate_model.dart
// import 'package:cloud_firestore/cloud_firestore.dart'; // REMOVED: Migrating to backend server

class CandidateModel {
  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String country;
  final String profession;
  final int age;
  final String gender;
  final String profileImageUrl;

  final bool hasApplied;
  final bool applicationPaid;
  final DateTime? applicationDate;

  final Map<String, String> documents;
  final bool documentsUnlocked;

  final bool interviewScheduled;
  final DateTime? interviewDate;
  final String interviewStatus;

  final bool isHired;
  final bool hirePaid;
  final DateTime? hireDate;

  final String status;
  final DateTime? deploymentDate;

  CandidateModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.country,
    required this.profession,
    required this.age,
    required this.gender,
    required this.profileImageUrl,
    this.hasApplied = false,
    this.applicationPaid = false,
    this.applicationDate,
    this.documents = const {},
    this.documentsUnlocked = false,
    this.interviewScheduled = false,
    this.interviewDate,
    this.interviewStatus = 'Pending',
    this.isHired = false,
    this.hirePaid = false,
    this.hireDate,
    this.status = 'available',
    this.deploymentDate,
  });

  // Factory from backend map
  factory CandidateModel.fromMap(Map<String, dynamic> data, String id) {
    return CandidateModel(
      id: id,
      fullName: data['fullName'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      country: data['country'] ?? '',
      profession: data['profession'] ?? '',
      age: (data['age'] is int)
          ? data['age']
          : int.tryParse('${data['age']}') ?? 0,
      gender: data['gender'] ?? '',
      profileImageUrl: data['profileImageUrl'] ?? '',
      hasApplied: data['hasApplied'] ?? false,
      applicationPaid: data['applicationPaid'] ?? false,
      applicationDate: _parseDate(data['applicationDate']),
      documents: Map<String, String>.from(data['documents'] ?? {}),
      documentsUnlocked: data['documentsUnlocked'] ?? false,
      interviewScheduled: data['interviewScheduled'] ?? false,
      interviewDate: _parseDate(data['interviewDate']),
      interviewStatus: data['interviewStatus'] ?? 'Pending',
      isHired: data['isHired'] ?? false,
      hirePaid: data['hirePaid'] ?? false,
      hireDate: _parseDate(data['hireDate']),
      status: data['status'] ?? 'available',
      deploymentDate: _parseDate(data['deploymentDate']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'country': country,
      'profession': profession,
      'age': age,
      'gender': gender,
      'profileImageUrl': profileImageUrl,
      'hasApplied': hasApplied,
      'applicationPaid': applicationPaid,
      'applicationDate': applicationDate?.toIso8601String(),
      'documents': documents,
      'documentsUnlocked': documentsUnlocked,
      'interviewScheduled': interviewScheduled,
      'interviewDate': interviewDate?.toIso8601String(),
      'interviewStatus': interviewStatus,
      'isHired': isHired,
      'hirePaid': hirePaid,
      'hireDate': hireDate?.toIso8601String(),
      'status': status,
      'deploymentDate': deploymentDate?.toIso8601String(),
    };
  }

  CandidateModel copyWith({
    String? fullName,
    String? email,
    String? phone,
    String? country,
    String? profession,
    int? age,
    String? gender,
    String? profileImageUrl,
    bool? hasApplied,
    bool? applicationPaid,
    DateTime? applicationDate,
    Map<String, String>? documents,
    bool? documentsUnlocked,
    bool? interviewScheduled,
    DateTime? interviewDate,
    String? interviewStatus,
    bool? isHired,
    bool? hirePaid,
    DateTime? hireDate,
    String? status,
    DateTime? deploymentDate,
  }) {
    return CandidateModel(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      country: country ?? this.country,
      profession: profession ?? this.profession,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      hasApplied: hasApplied ?? this.hasApplied,
      applicationPaid: applicationPaid ?? this.applicationPaid,
      applicationDate: applicationDate ?? this.applicationDate,
      documents: documents ?? this.documents,
      documentsUnlocked: documentsUnlocked ?? this.documentsUnlocked,
      interviewScheduled: interviewScheduled ?? this.interviewScheduled,
      interviewDate: interviewDate ?? this.interviewDate,
      interviewStatus: interviewStatus ?? this.interviewStatus,
      isHired: isHired ?? this.isHired,
      hirePaid: hirePaid ?? this.hirePaid,
      hireDate: hireDate ?? this.hireDate,
      status: status ?? this.status,
      deploymentDate: deploymentDate ?? this.deploymentDate,
    );
  }
}
