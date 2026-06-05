class Job {
  final String id;
  final String employerId;
  final String jobTitle;
  final String companyName;
  final String location;
  final String country;
  final int salary;
  final String currency;
  final int candidateCommission;
  final int employerFee;
  final String experienceLevel;
  final int vacancies;
  final bool featured;
  final String localOrInternational;

  Job({
    required this.id,
    required this.employerId,
    required this.jobTitle,
    required this.companyName,
    required this.location,
    required this.country,
    required this.salary,
    required this.currency,
    required this.candidateCommission,
    required this.employerFee,
    required this.experienceLevel,
    required this.vacancies,
    required this.featured,
    required this.localOrInternational,
  });

  factory Job.fromMap(Map<String, dynamic> json) {
    return Job(
      id: json['id'].toString(),
      employerId: json['employerId'] ?? '',
      jobTitle: json['jobTitle'] ?? '',
      companyName: json['companyName'] ?? '',
      location: json['location'] ?? '',
      country: json['country'] ?? '',
      salary: json['salary'] ?? 0,
      currency: json['currency'] ?? 'KES',
      candidateCommission: json['candidateCommission'] ?? 0,
      employerFee: json['employerFee'] ?? 0,
      experienceLevel: json['experienceLevel'] ?? '',
      vacancies: json['vacancies'] ?? 0,
      featured: json['featured'] ?? false,
      localOrInternational: json['localOrInternational'] ?? '',
    );
  }

  factory Job.fromJson(Map<String, dynamic> json) => Job.fromMap(json);

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employerId': employerId,
      'jobTitle': jobTitle,
      'companyName': companyName,
      'location': location,
      'country': country,
      'salary': salary,
      'currency': currency,
      'candidateCommission': candidateCommission,
      'employerFee': employerFee,
      'experienceLevel': experienceLevel,
      'vacancies': vacancies,
      'featured': featured,
      'localOrInternational': localOrInternational,
    };
  }
}
