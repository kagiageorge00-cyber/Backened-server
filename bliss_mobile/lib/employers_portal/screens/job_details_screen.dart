// lib/employers_portal/screens/job_details_screen.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';

import '../models/job_model.dart'; // now using Job
import '../models/candidate_model.dart';
import '../services/payment_service.dart';
import '../widgets/candidate_card.dart';
import '../../services/activity_log_service.dart';
import '../../services/backend_auth.dart';
import '../models/user_role.dart';

class JobDetailsScreen extends StatefulWidget {
  final Job job; // updated

  const JobDetailsScreen({super.key, required this.job});

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  final PaymentService _paymentService = PaymentService();

  /// Fetch applicants for this job from backend
  Future<List<CandidateModel>> applicantsStream() async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/getJobApplicants'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"jobId": widget.job.id}),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['applicants'] is List) {
        return (data['applicants'] as List)
            .map((c) => CandidateModel.fromJson(c))
            .toList();
      } else {
        throw Exception(data['error'] ?? data['message'] ?? 'Failed to load applicants');
      }
    } else {
      throw Exception('Failed to load applicants');
    }
  }

  /// Mark a candidate as hired using backend
  Future<void> _hireCandidate(CandidateModel candidate) async {
    try {
      final candidateCountry = candidate.country.toLowerCase().trim();
      final jobLocation = widget.job.location.toLowerCase().trim();
      final bool isLocal = candidateCountry.isNotEmpty &&
          (candidateCountry.contains(jobLocation) ||
              jobLocation.contains(candidateCountry));
      final double commissionAmount = isLocal ? 300.0 : 500.0;
      final String commissionTag = isLocal ? 'Local' : 'International';

      final response = await http.post(
        Uri.parse('https://backened-server.onrender.com/hireCandidate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "candidateId": candidate.id,
          "jobId": widget.job.id,
          "commissionAmount": commissionAmount,
          "commissionTag": commissionTag,
        }),
      );
      print("STATUS: ${response.statusCode}");
      print("BODY: ${response.body}");
      if (response.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  '${candidate.fullName} marked hired and hire payment created. Commission due: \$commissionAmount.')),
        );
      } else {
        throw Exception('Failed to hire candidate');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to mark candidate hired: $e')),
      );
    }
  }
  }

  Future<void> _markHirePaidAndUnlock(CandidateModel candidate) async {
    try {
      final response = await http.post(
        Uri.parse('https://backened-server.onrender.com/markHirePaidAndUnlock'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'candidateId': candidate.id,
          'jobId': widget.job.id,
        }),
      );
      if (response.statusCode == 200) {
        // Optionally log deployment update via backend if needed
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Candidate payment verified and documents unlocked.')));
        setState(() {});
      } else {
        throw Exception('Failed to verify hire payment');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to verify hire payment: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final Job job = widget.job; // updated

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        title: Text(
          job.title,
          style: const TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Job card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 5)],
            ),
            padding: const EdgeInsets.all(20),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(job.title,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(job.employerName,
                  style: const TextStyle(fontSize: 16, color: Colors.grey)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _infoTile("Salary", job.salary.toString()),
                  _infoTile("Location", job.location),
                  _infoTile("Contract", job.contractType),
                ],
              )
            ]),
          ),

          const SizedBox(height: 20),

          // Description
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 5)],
            ),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text("Job Description",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Text(job.description,
                  style: const TextStyle(fontSize: 15, height: 1.4)),
            ]),
          ),

          const SizedBox(height: 20),

          // Dates
          Text("Posted: ${job.postedAt.toLocal().toString().split(' ')[0]}",
              style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
          if (job.expiryDate != null)
            Text(
                "Expires: ${job.expiryDate!.toLocal().toString().split(' ')[0]}",
                style: TextStyle(fontSize: 14, color: Colors.red.shade700)),

          const SizedBox(height: 24),

          // Applicants header
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text("Applicants",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text("Count: ${job.applicantsCount}",
                style: const TextStyle(fontSize: 14, color: Colors.grey)),
          ]),

          const SizedBox(height: 12),

          // Applicants list
          StreamBuilder<List<CandidateModel>>(
            stream: applicantsStream(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: CircularProgressIndicator()),
                );
              }

              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: const Text("No applicants yet.",
                      style: TextStyle(fontSize: 14, color: Colors.grey)),
                );
              }

              final applicants = snapshot.data!;
              return Column(
                children: applicants.map((candidate) {
                  return CandidateCard(
                    id: candidate.id,
                    name: candidate.fullName,
                    age: candidate.age.toString(),
                    experience: candidate.profession,
                    country: candidate.country,
                    salary: 'N/A',
                    imageUrl: candidate.profileImageUrl.isNotEmpty
                        ? candidate.profileImageUrl
                        : 'https://via.placeholder.com/150',
                    onViewDetails: () => _showCandidateDetails(candidate),
                    onHire: candidate.isHired
                        ? null
                        : () => _confirmHire(candidate),
                  );
                }).toList(),
              );
            },
          ),

          const SizedBox(height: 30),

          // Bottom button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: Colors.blueAccent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                Navigator.pushNamed(context, '/employers-marketplace');
              },
              child: const Text("View Candidates Marketplace",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _infoTile(String title, String value) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title,
          style: const TextStyle(
              fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w500)),
      const SizedBox(height: 4),
      Text(value,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
    ]);
  }

  void _showCandidateDetails(CandidateModel candidate) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(candidate.fullName),
          content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Age: ${candidate.age}"),
                Text("Country: ${candidate.country}"),
                Text("Profession: ${candidate.profession}"),
                Text("Phone: ${candidate.phone}"),
                Text("Email: ${candidate.email}"),
                const SizedBox(height: 8),
                Text("Applied: ${candidate.hasApplied ? 'Yes' : 'No'}"),
                Text(
                    "Application paid: ${candidate.applicationPaid ? 'Yes' : 'No'}"),
                Text(
                    "Interview scheduled: ${candidate.interviewScheduled ? 'Yes' : 'No'}"),
                Text("Interview status: ${candidate.interviewStatus}"),
                Text("Hired: ${candidate.isHired ? 'Yes' : 'No'}"),
                Text("Hire paid: ${candidate.hirePaid ? 'Yes' : 'No'}"),
                Text(
                    "Documents unlocked: ${candidate.documentsUnlocked ? 'Yes' : 'No'}"),
              ]),
          actions: [
            if (candidate.isHired && !candidate.hirePaid)
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _markHirePaidAndUnlock(candidate);
                },
                child: const Text('Mark Hire Paid',
                    style: TextStyle(color: Colors.green)),
              ),
            if (candidate.isHired &&
                candidate.hirePaid &&
                !candidate.documentsUnlocked)
              TextButton(
                onPressed: () async {
                  Navigator.of(context).pop();
                  try {
                    final response = await http.post(
                      Uri.parse('https://backened-server.onrender.com/unlockDocuments'),
                      headers: {'Content-Type': 'application/json'},
                      body: jsonEncode({'candidateId': candidate.id, 'jobId': widget.job.id}),
                    );
                    if (response.statusCode == 200) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Candidate documents unlocked.')));
                      setState(() {});
                    } else {
                      throw Exception('Failed to unlock documents');
                    }
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to unlock documents: $e')),
                    );
                  }
                },
                child: const Text('Unlock Documents',
                    style: TextStyle(color: Colors.blue)),
              ),
            TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close')),
          ],
        );
      },
    );
  }

  void _confirmHire(CandidateModel candidate) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Confirm Hire'),
          content: Text(
              'Are you sure you want to mark ${candidate.fullName} as hired?'),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel')),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _hireCandidate(candidate);
              },
              child:
                  const Text('Hire', style: TextStyle(color: Colors.redAccent)),
            ),
          ],
        );
      },
    );
  }
}
