// widgets/job_card.dart
import 'package:flutter/material.dart';

class JobCard extends StatelessWidget {
  final  job;
  final VoidCallback onApply;

  const JobCard({super.key, required this.job, required this.onApply});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Job title & featured badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${job.jobTitle} - ${job.country}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (job.featured)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Featured',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),

            // Company & Location
            Text(
              '${job.companyName} • ${job.location}',
              style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87),
            ),
            const SizedBox(height: 6),

            // Salary, Candidate Commission, Employer Fee, Experience
            Text('Salary: ${job.salary} ${job.currency}'),
            Text('Candidate Commission: ${job.candidateCommission} ${job.currency}'),
            Text('Employer Fee: ${job.employerFee} ${job.currency}'),
            Text('Experience: ${job.experienceLevel}'),
            const SizedBox(height: 12),

            // Vacancies
            Text('Vacancies: ${job.vacancies}'),
            const SizedBox(height: 12),

            // Apply button
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: onApply,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Apply'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
