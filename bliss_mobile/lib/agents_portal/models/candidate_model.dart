// lib/employers_portal/models/candidate_model.dart

class CandidateModel {
  final String candidateId;
  final String fullName;
  final String photoUrl;
  final String skills;
  final String experience;
  final String cvUrl;
  final String videoUrl;
  final String agentId;
  final DateTime createdAt;
  final String email;
  final String phone;

  // Optional / future fields
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

  final String status; // available / deployed
  final DateTime? deploymentDate;

  // NEW FIELDS
  final String nationality;
  final String maritalStatus;
  final int numberOfChildren;
  final String religion;
  final String educationalLevel;

  CandidateModel({
    required this.candidateId,
    required this.fullName,
    required this.photoUrl,
    required this.skills,
    required this.experience,
    required this.cvUrl,
    required this.videoUrl,
    required this.agentId,
    required this.createdAt,
    required this.email,
    required this.phone,
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
    this.nationality = '',
    this.maritalStatus = '',
    this.numberOfChildren = 0,
    this.religion = '',
    this.educationalLevel = '',
  });

  /// Factory to create from backend map
  factory CandidateModel.fromMap(Map<String, dynamic> data, String documentId) {
    return CandidateModel(
      candidateId: documentId,
      fullName: data['fullName'] ?? '',
      photoUrl: data['photoUrl'] ?? '',
      skills: data['skills'] ?? '',
      experience: data['experience'] ?? '',
      cvUrl: data['cvUrl'] ?? '',
      videoUrl: data['videoUrl'] ?? '',
      agentId: data['agentId'] ?? '',
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      hasApplied: data['hasApplied'] ?? false,
      applicationPaid: data['applicationPaid'] ?? false,
      applicationDate: _parseTimestampOrString(data['applicationDate']),
      documents: Map<String, String>.from(data['documents'] ?? {}),
      documentsUnlocked: data['documentsUnlocked'] ?? false,
      interviewScheduled: data['interviewScheduled'] ?? false,
      interviewDate: _parseTimestampOrString(data['interviewDate']),
      interviewStatus: data['interviewStatus'] ?? 'Pending',
      isHired: data['isHired'] ?? false,
      hirePaid: data['hirePaid'] ?? false,
      hireDate: _parseTimestampOrString(data['hireDate']),
      status: data['status'] ?? 'available',
      deploymentDate: _parseTimestampOrString(data['deploymentDate']),
      nationality: data['nationality'] ?? '',
      maritalStatus: data['maritalStatus'] ?? '',
      numberOfChildren: data['numberOfChildren'] ?? 0,
      religion: data['religion'] ?? '',
      educationalLevel: data['educationalLevel'] ?? '',
    );
  }

  /// Convert CandidateModel to Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'fullName': fullName,
      'photoUrl': photoUrl,
      'skills': skills,
      'experience': experience,
      'cvUrl': cvUrl,
      'videoUrl': videoUrl,
      'agentId': agentId,
      'createdAt': createdAt,
      'email': email,
      'phone': phone,
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
      'nationality': nationality,
      'maritalStatus': maritalStatus,
      'numberOfChildren': numberOfChildren,
      'religion': religion,
      'educationalLevel': educationalLevel,
    };
  }

  /// Clone with updates
  CandidateModel copyWith({
    String? fullName,
    String? photoUrl,
    String? skills,
    String? experience,
    String? cvUrl,
    String? videoUrl,
    String? agentId,
    DateTime? createdAt,
    String? email,
    String? phone,
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
    String? nationality,
    String? maritalStatus,
    int? numberOfChildren,
    String? religion,
    String? educationalLevel,
  }) {
    return CandidateModel(
      candidateId: candidateId,
      fullName: fullName ?? this.fullName,
      photoUrl: photoUrl ?? this.photoUrl,
      skills: skills ?? this.skills,
      experience: experience ?? this.experience,
      cvUrl: cvUrl ?? this.cvUrl,
      videoUrl: videoUrl ?? this.videoUrl,
      agentId: agentId ?? this.agentId,
      createdAt: createdAt ?? this.createdAt,
      email: email ?? this.email,
      phone: phone ?? this.phone,
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
      nationality: nationality ?? this.nationality,
      maritalStatus: maritalStatus ?? this.maritalStatus,
      numberOfChildren: numberOfChildren ?? this.numberOfChildren,
      religion: religion ?? this.religion,
      educationalLevel: educationalLevel ?? this.educationalLevel,
    );
  }

  /// Helper to parse ISO string or DateTime safely
  static DateTime? _parseTimestampOrString(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }
}
