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
        title: jobTitle,
        employerName: '', // Set if available
        employerId: '', // Set if available
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
      Navigator.pop(context); // back to post job
      Navigator.pop(context); // back to dashboard
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Failed to post job: $e"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              color: Colors.black87,
              fontWeight: FontWeight.w500,
            ),
          ),
          const Divider(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        foregroundColor: Colors.black87,
        centerTitle: true,
        title: const Text(
          "Review Job",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: Colors.black87,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          children: [
            _buildRow("Job Title", jobTitle),
            _buildRow("Category", jobCategory),
            _buildRow("Location", location),
            _buildRow("Salary", salary),
            _buildRow("Description", description),
            _buildRow("Requirements", requirements),
            const SizedBox(height: 40),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey.shade400,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: const Text(
                      "Edit",
                      style: TextStyle(fontSize: 16, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade700,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () => _postJob(context),
                    child: const Text(
                      "Post Job",
                      style: TextStyle(fontSize: 16, color: Colors.white),
                    ),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
