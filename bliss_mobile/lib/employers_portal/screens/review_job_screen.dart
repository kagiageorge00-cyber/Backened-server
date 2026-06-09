import 'package:flutter/material.dart';
import '../models/job_model.dart';
import '../services/job_service_http.dart';

class ReviewJobScreen extends StatelessWidget {
  final String jobTitle;
  final String jobCategory;
  final String location;
  final String salary;
  final String description;
  final String requirements;

  const ReviewJobScreen({
    super.key,
    required this.jobTitle,
    required this.jobCategory,
    required this.location,
    required this.salary,
    required this.description,
    required this.requirements,
  });

  Future<void> _postJob(BuildContext context) async {
  try {
    final job = Job(
      id: jobId,
      title: jobTitle,
      employerName: '',
      employerId: '',
      location: location,
      salary: double.tryParse(salary) ?? 0,
      description: description,
      contractType: jobCategory,
      postedAt: DateTime.now(),
      expiryDate: null,
      applicantsCount: 0,
    );

    await JobService().createJob(job);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Job posted successfully!"),
        backgroundColor: Colors.green,
      ),
    );

    Navigator.pop(context);
    Navigator.pop(context);
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Failed to post job: $e"),
        backgroundColor: Colors.red,
      ),
    );
  }
}