class EmployerModel {
  final String employerId;
  final String companyName;
  final String email;
  final String phone;
  final String logoUrl;
  final List<String> hiredCandidateIds; // List of candidate IDs hired through agents
  final double rating; // Employer rating by agents
  final DateTime createdAt;

  EmployerModel({
    required this.employerId,
    required this.companyName,
    required this.email,
    required this.phone,
    this.logoUrl = '',
    this.hiredCandidateIds = const [],
    this.rating = 0.0,
    required this.createdAt,
  });

  // ------------------------
  // Factory method to create Employer from backend data
  // ------------------------
  factory EmployerModel.fromMap(Map<String, dynamic> data, String id) {
    return EmployerModel(
      employerId: id,
      companyName: data['companyName'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      logoUrl: data['logoUrl'] ?? '',
      hiredCandidateIds: List<String>.from(data['hiredCandidateIds'] ?? []),
      rating: (data['rating'] != null) ? (data['rating'] as num).toDouble() : 0.0,
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
    );
  }

  // ------------------------
  // Convert Employer to backend-compatible Map
  // ------------------------
  Map<String, dynamic> toMap() {
    return {
      'companyName': companyName,
      'email': email,
      'phone': phone,
      'logoUrl': logoUrl,
      'hiredCandidateIds': hiredCandidateIds,
      'rating': rating,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ------------------------
  // Update Employer data
  // ------------------------
  EmployerModel copyWith({
    String? companyName,
    String? email,
    String? phone,
    String? logoUrl,
    List<String>? hiredCandidateIds,
    double? rating,
  }) {
    return EmployerModel(
      employerId: employerId,
      companyName: companyName ?? this.companyName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      logoUrl: logoUrl ?? this.logoUrl,
      hiredCandidateIds: hiredCandidateIds ?? this.hiredCandidateIds,
      rating: rating ?? this.rating,
      createdAt: createdAt,
    );
  }
}
