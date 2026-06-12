class CandidateUser {
  final String id;
  final String fullName;
  final String phone;
  final String email;

  CandidateUser(
      {required this.id,
      required this.fullName,
      required this.phone,
      required this.email});

  factory CandidateUser.fromJson(Map<String, dynamic> json) => CandidateUser(
        id: json['uniqueCode']?.toString() ??
            json['candidateId']?.toString() ??
            json['_id']?.toString() ??
            '',
        fullName: json['name'] ?? json['fullName'] ?? '',
        phone: json['phone'] ?? '',
        email: json['email'] ?? '',
      );
}
