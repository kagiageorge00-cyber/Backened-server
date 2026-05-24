import 'package:flutter/material.dart';
import '../models/job_model.dart'; // Make sure this points to lib/models/job_model.dart
import 'widgets/job_card.dart';

class SystemJobsScreen extends StatelessWidget {
  final List<Job> jobs;

  const SystemJobsScreen({super.key, required this.jobs});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('System Jobs'),
      ),
      body: ListView.builder(
        itemCount: jobs.length,
        itemBuilder: (context, index) {
          final job = jobs[index];
          return JobCard(
            job: job,
            onApply: () {
              // Navigate to Candidate Application Screen
            },
          );
        },
      ),
    );
  }
}
