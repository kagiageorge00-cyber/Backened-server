import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/job_model.dart';

class JobService {
  final String _base = AppConfig.backendUrl;

  Future<List<Job>> getJobs() async {
    try {
      final resp = await http.get(
        Uri.parse('$_base/api/jobs'),
        headers: {"Content-Type": "application/json"},
      );

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);

        if (data['success'] == true && data['jobs'] != null) {
          return (data['jobs'] as List)
              .map<Job>((j) => Job.fromMap(j))
              .toList();
        }
      }

      return _fallbackJobs();
    } catch (e) {
      print("❌ Job fetch error: $e");
      return _fallbackJobs();
    }
  }

  Future<List<Job>> getFeaturedJobs() async {
    final jobs = await getJobs();
    return jobs.where((j) => j.featured == true).toList();
  }

  Future<List<Job>> getJobsByCountry(String country) async {
    final jobs = await getJobs();
    return jobs
        .where((j) =>
            j.country.toLowerCase() == country.toLowerCase())
        .toList();
  }

  Future<List<Job>> getJobsByCategory(String category) async {
    final jobs = await getJobs();
    return jobs
        .where((j) =>
            j.jobTitle.toLowerCase().contains(category.toLowerCase()))
        .toList();
  }

  // ✅ fallback
  List<Job> _fallbackJobs() {
    return [
      Job(
        id: '1',
        employerId: 'emp1',
        jobTitle: 'Housemaid',
        companyName: 'Bliss Connect',
        location: 'Dubai',
        country: 'UAE',
        salary: 1000,
        currency: 'AED',
        candidateCommission: 80000,
        employerFee: 1000,
        experienceLevel: 'Fresher',
        vacancies: 30,
        featured: true,
        localOrInternational: 'International',
      ),
    ];
  }
}