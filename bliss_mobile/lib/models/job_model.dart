// job_model.dart
class Job {
  final String id;
  final String employerId;
  final String jobTitle;
  final String companyName;
  final String location;
  final String country;
  final double salary;
  final String currency;
  final double candidateCommission;
  final double employerFee;
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
}
