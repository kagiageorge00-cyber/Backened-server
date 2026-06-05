// lib/employers_portal/models/candidate_model.dart
class CandidateModel {
  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String country;
  final String profession;
  final int age;
  final String gender;
  final String profileImageUrl;

  // Application
  final bool hasApplied;
  final bool applicationPaid;
  final DateTime? applicationDate;

  // Documents
  final Map<String, String> documents;
  final bool documentsUnlocked;

  // Interview
  final bool interviewScheduled;
  final DateTime? interviewDate;
  final String interviewStatus;

  // Hire
  final bool isHired;
  final bool hirePaid;
  final DateTime? hireDate;

  // Deployment
  final String status;
  final DateTime? deploymentDate;

  // NEW FIELDS
  final String nationality;
  final String maritalStatus;
  final int numberOfChildren;
  final String religion;
  final String educationalLevel;

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
    this.nationality = '',
    this.maritalStatus = '',
    this.numberOfChildren = 0,
    this.religion = '',
    this.educationalLevel = '',
  });

  /// ✅ FROM BACKEND (JSON)
  factory CandidateModel.fromMap(Map<String, dynamic> data, String id) {
    return CandidateModel(
      id: id,
      fullName: data['fullName'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      country: data['country'] ?? '',
      profession: data['profession'] ?? '',
      age: data['age'] ?? 0,
      gender: data['gender'] ?? '',
      profileImageUrl: data['profileImageUrl'] ?? '',
      hasApplied: data['hasApplied'] ?? false,
      applicationPaid: data['applicationPaid'] ?? false,
      applicationDate: data['applicationDate'] != null
          ? DateTime.tryParse(data['applicationDate'])
          : null,
      documents: Map<String, String>.from(data['documents'] ?? {}),
      documentsUnlocked: data['documentsUnlocked'] ?? false,
      interviewScheduled: data['interviewScheduled'] ?? false,
      interviewDate: data['interviewDate'] != null
          ? DateTime.tryParse(data['interviewDate'])
          : null,
      interviewStatus: data['interviewStatus'] ?? 'Pending',
      isHired: data['isHired'] ?? false,
      hirePaid: data['hirePaid'] ?? false,
      hireDate:
          data['hireDate'] != null ? DateTime.tryParse(data['hireDate']) : null,
      status: data['status'] ?? 'available',
      deploymentDate: data['deploymentDate'] != null
          ? DateTime.tryParse(data['deploymentDate'])
          : null,
      nationality: data['nationality'] ?? '',
      maritalStatus: data['maritalStatus'] ?? '',
      numberOfChildren: data['numberOfChildren'] ?? 0,
      religion: data['religion'] ?? '',
      educationalLevel: data['educationalLevel'] ?? '',
    );
  }

  /// ✅ TO BACKEND (JSON)
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
      'nationality': nationality,
      'maritalStatus': maritalStatus,
      'numberOfChildren': numberOfChildren,
      'religion': religion,
      'educationalLevel': educationalLevel,
    };
  }

  /// ✅ COPY WITH
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
    String? nationality,
    String? maritalStatus,
    int? numberOfChildren,
    String? religion,
    String? educationalLevel,
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
      nationality: nationality ?? this.nationality,
      maritalStatus: maritalStatus ?? this.maritalStatus,
      numberOfChildren: numberOfChildren ?? this.numberOfChildren,
      religion: religion ?? this.religion,
      educationalLevel: educationalLevel ?? this.educationalLevel,
    );
  }
}
