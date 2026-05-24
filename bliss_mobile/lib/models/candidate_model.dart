class Candidate {
  final String id;
  final String fullName;
  final int age;
  final String gender;
  final String country;
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

  Candidate({
    required this.id,
    required this.fullName,
    required this.age,
    required this.gender,
    required this.country,
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
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fullName': fullName,
      'age': age,
      'gender': gender,
      'country': country,
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
    };
  }
}
