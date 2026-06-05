import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:bliss_mobile/firebase_stub.dart';

class EmployerApplicantsScreen extends StatelessWidget {
  final String employerId;

  const EmployerApplicantsScreen({super.key, required this.employerId});

  Future<List<Map<String, dynamic>>> _fetchApplicants() async {
    final firestore = FirebaseFirestore.instance;

    // 1️⃣ Get jobs created by employer
    final jobsSnapshot = await firestore
        .collection('jobs')
        .where('employerId', isEqualTo: employerId)
        .get();

    final jobIds = jobsSnapshot.docs.map((doc) => doc.id).toList();

    if (jobIds.isEmpty) return [];

    // 2️⃣ Fetch applicants who applied for any employer job
    final applicationsSnapshot = await firestore
        .collection('applications')
        .where('jobId', whereIn: jobIds)
        .get();

    return applicationsSnapshot.docs.map((doc) {
      final data = doc.data();
      data['appId'] = doc.id;
      return data;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Applicants"),
          ],
        ),
      ),
      body: FutureBuilder(
        future: _fetchApplicants(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final applicants = snapshot.data ?? [];

          if (applicants.isEmpty) {
            return const Center(child: Text("No applicants yet"));
          }

          return ListView.builder(
            itemCount: applicants.length,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            itemBuilder: (context, index) {
              final applicant = applicants[index];

              return Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8.0, vertical: 10),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 8,
                      )
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: ListTile(
                      tileColor: Colors.white,
                      title: Text(
                        applicant['candidateName'] ?? "Unknown",
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle:
                          Text("Status: ${applicant['status'] ?? 'Pending'}"),
                      trailing: const Icon(Icons.arrow_forward),
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          '/candidateDetails',
                          arguments: {
                            'candidateId': applicant['candidateId'],
                            'applicationId': applicant['appId']
                          },
                        );
                      },
                    ),
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
