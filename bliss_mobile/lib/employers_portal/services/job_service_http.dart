import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/job_model.dart';
import '../../services/activity_log_service.dart';
import '../../services/backend_auth.dart';
import '../models/user_role.dart';

class JobService {
  static const String baseUrl =
      'https://backend-server.onrender.com/api/jobs';

  /// CREATE JOB
  Future<String> createJob(Job job) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode(job.toJson()),
    );

    if (response.statusCode == 200 ||
        response.statusCode == 201) {
      final data = jsonDecode(response.body);

      await ActivityLogService.log(
        type: 'job_creation',
        actorId: BackendAuth.userId ?? job.employerId,
        actorRole: UserRole.employer.value,
        description: 'Created job: ${job.title}',
        details: job.toJson(),
      );

      return data['data']?['id']?.toString() ?? '';
    }

    throw Exception(
      'Failed to create job: ${response.body}',
    );
  }

  /// UPDATE JOB
  Future<void> updateJob(Job job) async {
    final response = await http.put(
      Uri.parse('$baseUrl/${job.id}'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode(job.toJson()),
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Failed to update job: ${response.body}',
      );
    }
  }

  /// GET ALL JOBS
  Future<List<Job>> fetchJobs() async {
    final response = await http.get(
      Uri.parse(baseUrl),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['success'] == true &&
          data['data'] is List) {
        return (data['data'] as List)
            .map((job) => Job.fromJson(job))
            .toList();
      }
    }

    throw Exception('Failed to fetch jobs');
  }

  /// GET EMPLOYER JOBS
  Future<List<Job>> fetchEmployerJobs(
    String employerId,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl?employerId=$employerId'),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['success'] == true &&
          data['data'] is List) {
        return (data['data'] as List)
            .map((job) => Job.fromJson(job))
            .toList();
      }
    }

    throw Exception(
      'Failed to fetch employer jobs',
    );
  }

  /// GET SINGLE JOB
  Future<Job?> fetchJobById(
    String id,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$id'),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['success'] == true &&
          data['data'] != null) {
        return Job.fromJson(data['data']);
      }
    }

    return null;
  }

  /// DELETE JOB
  Future<void> deleteJob(
    String id,
  ) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/$id'),
    );

    if (response.statusCode != 200) {
      throw Exception(
        'Failed to delete job',
      );
    }
  }
}