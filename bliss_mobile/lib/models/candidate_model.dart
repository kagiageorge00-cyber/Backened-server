class Candidate {
  final String id;
  final String fullName;
  final int age;
  final String gender;
  final String country;
  final String nationality;
  final double expectedSalary;
  final double hireCost;
  final List<String> skills;
  final int experienceYears;
  final String photoUrl;
  String videoUrl; // mutable
  final String passportStatus;
  final String visaOption;
  final String currency;
  final String phone;
  final String email; // required
  final bool feePaid;
  final bool medicalBooked;
  final String jobApplied;

  // NEW FIELDS
  final String maritalStatus;
  final int numberOfChildren;
  final String religion;
  final String educationalLevel;
  final DateTime? applicationDate;

  Candidate({
    required this.id,
    required this.fullName,
    required this.age,
    required this.gender,
    required this.country,
    this.nationality = '',
    required this.expectedSalary,
    required this.hireCost,
    required this.skills,
    required this.experienceYears,
    required this.photoUrl,
    this.videoUrl = '', // default empty string
    required this.passportStatus,
    required this.visaOption,
    required this.currency,
    required this.phone,
    required this.email, // keep required
    this.feePaid = false,
    this.medicalBooked = false,
    this.jobApplied = '',
    this.maritalStatus = '',
    this.numberOfChildren = 0,
    this.religion = '',
    this.educationalLevel = '',
    this.applicationDate,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fullName': fullName,
      'age': age,
      'gender': gender,
      'country': country,
      'nationality': nationality,
      'expectedSalary': expectedSalary,
      'hireCost': hireCost,
      'skills': skills,
      'experienceYears': experienceYears,
      'photoUrl': photoUrl,
      'videoUrl': videoUrl,
      'passportStatus': passportStatus,
      'visaOption': visaOption,
      'currency': currency,
      'phone': phone,
      'email': email,
      'feePaid': feePaid,
      'medicalBooked': medicalBooked,
      'jobApplied': jobApplied,
      'maritalStatus': maritalStatus,
      'numberOfChildren': numberOfChildren,
      'religion': religion,
      'educationalLevel': educationalLevel,
      'applicationDate': applicationDate?.toIso8601String(),
    };
  }
}
