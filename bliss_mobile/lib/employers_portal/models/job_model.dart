class Job {
  String id; // mutable for Firestore doc ID assignment
  final String employerId;
  final String employerName;
  final String title;
  final String description;
  final String location;
  final double salary; // optional, if salary offered
  final String contractType; // Full-time, Part-time, Contract
  final DateTime postedAt;
  final DateTime? expiryDate; // optional
  final int applicantsCount;

  Job({
    this.id = '',
    required this.employerId,
    required this.employerName,
    required this.title,
    required this.description,
    required this.location,
    required this.salary,
    required this.contractType,
    required this.postedAt,
    this.expiryDate,
    this.applicantsCount = 0,
  });

  /// Convert JSON Map → Job
  factory Job.fromJson(Map<String, dynamic> map) {
    return Job(
      id: map['id'] ?? '',
      employerId: map['employerId'] ?? '',
      employerName: map['employerName'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      location: map['location'] ?? '',
      salary: (map['salary'] ?? 0).toDouble(),
      contractType: map['contractType'] ?? '',
      postedAt: map['postedAt'] != null
          ? DateTime.parse(map['postedAt'])
          : DateTime.now(),
      expiryDate: map['expiryDate'] != null && map['expiryDate'] != ''
          ? DateTime.parse(map['expiryDate'])
          : null,
      applicantsCount: map['applicantsCount'] ?? 0,
    );
  }

  /// Convert Job → JSON Map
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employerId': employerId,
      'employerName': employerName,
      'title': title,
      'description': description,
      'location': location,
      'salary': salary,
      'contractType': contractType,
      'postedAt': postedAt.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'applicantsCount': applicantsCount,
    };
  }

  /// Clone with updates
  Job copyWith({
    String? employerId,
    String? employerName,
    String? title,
    String? description,
    String? location,
    double? salary,
    String? contractType,
    DateTime? postedAt,
    DateTime? expiryDate,
    int? applicantsCount,
  }) {
    return Job(
      id: id,
      employerId: employerId ?? this.employerId,
      employerName: employerName ?? this.employerName,
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      salary: salary ?? this.salary,
      contractType: contractType ?? this.contractType,
      postedAt: postedAt ?? this.postedAt,
      expiryDate: expiryDate ?? this.expiryDate,
      applicantsCount: applicantsCount ?? this.applicantsCount,
    );
  }
}
