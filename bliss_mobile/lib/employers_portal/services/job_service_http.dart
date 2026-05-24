import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/job_model.dart';
import '../../services/activity_log_service.dart';
import '../../services/backend_auth.dart';
import '../models/user_role.dart';

class JobService {
  static const String _baseUrl =
      'https://backened-server.onrender.com/api/jobs';

  // Create job
  Future<String> createJob(Job job) async {
    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(job.toJson()),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await ActivityLogService.log(
        type: 'job_creation',
        actorId: BackendAuth.userId ?? job.employerId,
        actorRole: UserRole.employer.value,
        description: 'Created job: ${job.title}',
        details: job.toJson(),
      );
      return data['data']['id'] ?? '';
    } else {
      throw Exception('Failed to create job');
    }
  }

  // Update job
  Future<void> updateJob(Job job) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/${job.id}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(job.toJson()),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update job');
    }
  }

  // Fetch all jobs (for marketplace)
  Future<List<Job>> fetchJobs() async {
    final response = await http.get(Uri.parse(_baseUrl));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] is List) {
        return (data['data'] as List).map((j) => Job.fromJson(j)).toList();
      }
    }
    throw Exception('Failed to fetch jobs');
  }

  // Fetch employer's jobs
  Future<List<Job>> fetchEmployerJobs(String employerId) async {
    final response =
        await http.get(Uri.parse('$_baseUrl?employerId=$employerId'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] is List) {
        return (data['data'] as List).map((j) => Job.fromJson(j)).toList();
      }
    }
    throw Exception('Failed to fetch employer jobs');
  }

  // Fetch job by ID
  Future<Job?> fetchJobById(String id) async {
    final response = await http.get(Uri.parse('$_baseUrl/$id'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return Job.fromJson(data['data']);
      }
    }
    return null;
  }
}
