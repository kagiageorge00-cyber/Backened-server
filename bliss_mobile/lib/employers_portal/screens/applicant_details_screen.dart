import 'package:flutter/material.dart';
import 'package:bliss_mobile/services/backend_application_service.dart';

class ApplicantDetailsScreen extends StatelessWidget {
  final String candidateId;
  final String candidateName;
  final String jobTitle;
  final String email;
  final String phone;
  final String country;
  final int age;
  final String gender;
  final String profession;

  const ApplicantDetailsScreen({
    super.key,
    required this.candidateId,
    required this.candidateName,
    required this.jobTitle,
    required this.email,
    required this.phone,
    required this.country,
    required this.age,
    required this.gender,
    required this.profession,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text(
          "Applicant Details",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Colors.black87,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _candidateCard(),
            const SizedBox(height: 30),
            _applicationStatus(),
          ],
        ),
      ),
    );
  }

  // ------------------------
  // BACKEND DATA
  // ------------------------
  Widget _applicationStatus() {
    return FutureBuilder<Map<String, dynamic>?>(
      future: BackendApplicationService.getApplication(candidateId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data == null) {
          return const Text("No application data found.");
        }

        final data = snapshot.data!;
        final status = data["status"] ?? "Pending Review";
        final notes = data["notes"] ?? "";

        return _statusCard(status, notes);
      },
    );
  }

  // ------------------------
  // UI COMPONENTS
  // ------------------------
  Widget _candidateCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _boxStyle(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            candidateName,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            "Applied for $jobTitle",
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 10),
          _infoRow("Email", email),
          _infoRow("Phone", phone),
          _infoRow("Country", country),
          _infoRow("Age", age.toString()),
          _infoRow("Gender", gender),
          _infoRow("Profession", profession),
        ],
      ),
    );
  }

  Widget _statusCard(String status, String notes) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _boxStyle(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Application Status",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status,
              style: const TextStyle(fontSize: 16, color: Colors.blue),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            "Notes",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              notes.isEmpty ? "No notes available" : notes,
              style: const TextStyle(fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }

  // ------------------------
  // HELPERS
  // ------------------------
  BoxDecoration _boxStyle() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      boxShadow: const [
        BoxShadow(
          color: Colors.black12,
          blurRadius: 10,
          offset: Offset(0, 3),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            flex: 5,
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
