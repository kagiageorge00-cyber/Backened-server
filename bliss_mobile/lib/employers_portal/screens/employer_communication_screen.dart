import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class EmployerCommunicationScreen extends StatefulWidget {
  final String employerId;
  final String employerName;

  const EmployerCommunicationScreen({
    super.key,
    required this.employerId,
    required this.employerName,
  });

  @override
  State<EmployerCommunicationScreen> createState() => _EmployerCommunicationScreenState();
}

class _EmployerCommunicationScreenState extends State<EmployerCommunicationScreen> {
  List<Map<String, dynamic>> candidates = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCandidates();
  }

  Future<void> _loadCandidates() async {
    try {
      final applications = await FirebaseFirestore.instance
          .collection('applications')
          .where('employerId', isEqualTo: widget.employerId)
          .get();

      final candidateIds = applications.docs
          .map((doc) => doc.data()['candidateId'] as String)
          .toSet()
          .toList();

      final candidateData = <Map<String, dynamic>>[];

      for (final candidateId in candidateIds) {
        final candidateDoc = await FirebaseFirestore.instance
            .collection('candidate_portal_users')
            .doc(candidateId)
            .get();

        if (candidateDoc.exists) {
          candidateData.add({
            'id': candidateId,
            ...candidateDoc.data()!,
          });
        }
      }

      setState(() {
        candidates = candidateData;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading candidates: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Communication'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : candidates.isEmpty
              ? const Center(
                  child: Text(
                    'No candidates have applied for your jobs yet.',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: candidates.length,
                  itemBuilder: (context, index) {
                    final candidate = candidates[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
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
                            leading: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 4,
                                  )
                                ],
                              ),
                              child: CircleAvatar(
                                backgroundColor: Colors.blue.shade100,
                                child: Text(
                                  candidate['name']?.toString().substring(0, 1).toUpperCase() ?? 'C',
                                  style: const TextStyle(color: Colors.blue),
                                ),
                              ),
                            ),
                            title: Text(
                              candidate['name'] ?? 'Unknown Candidate',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(candidate['phone'] ?? ''),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.chat, color: Colors.blue),
                                  onPressed: () {
                                    // Navigate to chat with candidate
                                    Navigator.pushNamed(
                                      context,
                                      '/chat_with_candidate',
                                      arguments: {
                                        'candidateId': candidate['id'],
                                        'candidateName': candidate['name'],
                                        'employerId': widget.employerId,
                                        'employerName': widget.employerName,
                                      },
                                    );
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.schedule, color: Colors.green),
                                  onPressed: () {
                                    // Navigate to schedule interview
                                    Navigator.pushNamed(
                                      context,
                                      '/schedule_interview',
                                      arguments: {
                                        'candidateId': candidate['id'],
                                        'candidateName': candidate['name'],
                                        'employerId': widget.employerId,
                                      },
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}