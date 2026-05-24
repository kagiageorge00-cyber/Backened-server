import '../models/candidate_model.dart';
class ResumeGeneratorService {
  static Future<String> generateResume(Candidate candidate) async {
    return '''
Name: ${candidate.fullName}
Age: ${candidate.age}
Email: ${candidate.email}
Phone: ${candidate.phone}
Country: ${candidate.country}
Expected Salary: ${candidate.expectedSalary} ${candidate.currency}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experienceYears} years
Description: Professional candidate ready for hire.
''';
  }
}
