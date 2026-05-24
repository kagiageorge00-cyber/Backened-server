//lib/employer_portal/screens/applicants_list_screen.dart

import 'package:flutter/material.dart';
import 'candidate_details_screen.dart';

class ApplicantsListScreen extends StatefulWidget {
  final String jobId;
  final String jobTitle;

  const ApplicantsListScreen({
    super.key,
    required this.jobId,
    required this.jobTitle,
  });

  @override
  State<ApplicantsListScreen> createState() => _ApplicantsListScreenState();
}

class _ApplicantsListScreenState extends State<ApplicantsListScreen> {
  bool isLoading = true;

  List<Map<String, dynamic>> applicants = [];

  @override
  void initState() {
    super.initState();
    _loadApplicants();
  }

  /// ---------------------------------------
  /// LOAD APPLICANTS FROM BACKEND
  /// ---------------------------------------
  Future<void> _loadApplicants() async {
    /// Replace with real backend call:
    ///
    /// applicants = await applicantsService.getApplicants(widget.jobId);

    await Future.delayed(const Duration(seconds: 1)); // Fake loading

    applicants = [
      {
        "id": "C001",
        "name": "Mary Wanjiku",
        "age": 24,
        "experience": "2 yrs",
        "status": "Pending",
        "avatar": null,
      },
      {
        "id": "C002",
        "name": "John Kamau",
        "age": 29,
        "experience": "3 yrs",
        "status": "Shortlisted",
        "avatar": null,
      },
      {
        "id": "C003",
        "name": "Sarah Ali",
        "age": 26,
        "experience": "1 yr",
        "status": "Rejected",
        "avatar": null,
      },
    ];

    setState(() => isLoading = false);
  }

  /// ---------------------------------------
  /// STATUS COLOR
  /// ---------------------------------------
  Color _statusColor(String status) {
    switch (status) {
      case "Pending":
        return Colors.orange;
      case "Shortlisted":
        return Colors.blue;
      case "Rejected":
        return Colors.red;
      case "Hired":
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  /// ---------------------------------------
  /// UPDATE STATUS
  /// ---------------------------------------
  void _updateStatus(int index, String newStatus) {
    setState(() => applicants[index]["status"] = newStatus);

    /// Backend:
    /// applicantsService.updateStatus(applicantId, newStatus);
  }

  /// ---------------------------------------
  /// MOVE TO CANDIDATE MARKETPLACE
  /// ---------------------------------------
  void _moveToMarketplace(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          "${applicants[index]["name"]} moved to Candidates Marketplace",
        ),
      ),
    );

    /// Backend:
    /// marketplaceService.moveToMarketplace(applicantId);
  }

  /// ---------------------------------------
  /// MAIN BUILD
  /// ---------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: Text(
          "${widget.jobTitle} Applicants",
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        elevation: 1,
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),

      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : applicants.isEmpty
              ? Center(
                  child: Text(
                    "No applicants yet.",
                    style: TextStyle(fontSize: 16, color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[400] : Colors.black54),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: applicants.length,
                  itemBuilder: (context, index) {
                    final applicant = applicants[index];

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            blurRadius: 8,
                            color: Colors.black.withOpacity(0.05),
                          )
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          /// ------------------------------------
                          /// Header Row
                          /// ------------------------------------
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.blue.shade100,
                                child: const Icon(Icons.person,
                                    size: 32, color: Colors.blue),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Text(
                                  applicant["name"],
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: _statusColor(applicant["status"])
                                      .withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  applicant["status"],
                                  style: TextStyle(
                                    color: _statusColor(applicant["status"]),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 10),

                          Text("Age: ${applicant["age"]}"),
                          Text("Experience: ${applicant["experience"]}"),

                          const SizedBox(height: 16),

                          /// ------------------------------------
                          /// ACTION BUTTONS
                          /// ------------------------------------
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue.shade600,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12)),
                                ),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => CandidateDetailsScreen(
                                        candidateId: applicant["id"],
                                      ),
                                    ),
                                  );
                                },
                                child: const Text("View"),
                              ),

                              /// INTERVIEW
                              OutlinedButton(
                                onPressed: () {
                                  /// Navigate to interview screen
                                },
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.blue),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text("Interview"),
                              ),

                              /// SHORTLIST
                              IconButton(
                                onPressed: () => _updateStatus(index, "Shortlisted"),
                                icon: const Icon(Icons.check_circle,
                                    color: Colors.blue),
                              ),

                              /// REJECT
                              IconButton(
                                onPressed: () => _updateStatus(index, "Rejected"),
                                icon: const Icon(Icons.cancel, color: Colors.red),
                              ),

                              /// MOVE TO MARKETPLACE
                              IconButton(
                                onPressed: () => _moveToMarketplace(index),
                                icon: const Icon(Icons.upload,
                                    color: Colors.orange),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
