import 'package:flutter/material.dart';
import '../services/job_service.dart';
import '../models/job_model.dart'; // ✅ ONLY THIS MODEL

class JobMarketplaceScreen extends StatelessWidget {
  const JobMarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final jobService = JobService();

    return Scaffold(
      appBar: AppBar(title: const Text("Job Marketplace")),
      body: FutureBuilder<List<Job>>(
        future: jobService.getJobs(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return const Center(child: Text("Error loading jobs"));
          }

          final jobs = snapshot.data ?? [];

          if (jobs.isEmpty) {
            return const Center(child: Text("No jobs available"));
          }

          return ListView.builder(
            itemCount: jobs.length,
            itemBuilder: (_, i) {
              final job = jobs[i];

              return Card(
                margin: const EdgeInsets.all(10),
                child: ListTile(
                  title: Text(job.jobTitle),
                  subtitle: Text(
                    "${job.location}, ${job.country}\n"
                    "Salary: ${job.salary} ${job.currency}",
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
