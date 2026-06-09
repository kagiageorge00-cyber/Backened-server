class Job {
  final String id;
  final String employerId;
  final String title;
  final String description;
  final String employerName;
  final String location;
  final String contractType;
  final String salary;
  final DateTime postedAt;
  final DateTime? expiryDate;
  final int applicantsCount;

  Job({
    required this.id,
    required this.employerId,
    required this.title,
    this.description = '',
    this.employerName = '',
    this.location = '',
    this.contractType = '',
    this.salary = '',
    DateTime? postedAt,
    this.expiryDate,
    this.applicantsCount = 0,
  }) : postedAt = postedAt ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employerId': employerId,
      'title': title,
      'description': description,
      'employerName': employerName,
      'location': location,
      'contractType': contractType,
      'salary': salary,
      'postedAt': postedAt.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'applicantsCount': applicantsCount,
    };
  }

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id']?.toString() ?? '',
      employerId: json['employerId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      employerName: json['employerName']?.toString() ??
          (json['companyName']?.toString() ?? ''),
      location: json['location']?.toString() ?? '',
      contractType: json['contractType']?.toString() ?? '',
      salary: json['salary']?.toString() ?? '',
      postedAt: json['postedAt'] != null
          ? DateTime.tryParse(json['postedAt']) ?? DateTime.now()
          : DateTime.now(),
      expiryDate: json['expiryDate'] != null
          ? DateTime.tryParse(json['expiryDate'])
          : null,
      applicantsCount: json['applicantsCount'] ?? 0,
    );
  }
}
