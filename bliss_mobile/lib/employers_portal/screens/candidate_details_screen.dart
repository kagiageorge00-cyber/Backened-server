import 'package:bliss_mobile/firebase_stub.dart';
import 'package:flutter/material.dart';
import '../services/interview_api_client.dart';
import '../widgets/interview_actions.dart';

class CandidateDetailsScreen extends StatefulWidget {
  final String candidateId;
  const CandidateDetailsScreen({super.key, required this.candidateId});

  @override
  State<CandidateDetailsScreen> createState() => _CandidateDetailsScreenState();
}

class _CandidateDetailsScreenState extends State<CandidateDetailsScreen> {
  dynamic candidateSnapshot;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadCandidate();
    _loadInterviews();
  }

  List<Map<String, dynamic>> interviews = [];

  Future<void> _loadInterviews() async {
    try {
      final list = await InterviewApiClient.fetchInterviewsForCandidate(
          widget.candidateId);
      if (!mounted) return;
      setState(() {
        interviews = list;
      });
    } catch (e) {
      // ignore
    }
  }

  Future<void> _loadCandidate() async {
    final doc = await FirebaseFirestore.instance
        .collection('candidates')
        .doc(widget.candidateId)
        .get();
    if (!mounted) return;
    setState(() {
      candidateSnapshot = doc;
      loading = false;
    });
  }

  Future<void> _updateCandidate(Map<String, dynamic> updates) async {
    await FirebaseFirestore.instance
        .collection('candidates')
        .doc(widget.candidateId)
        .update(updates);
    await _loadCandidate();
  }

  @override
  Widget build(BuildContext context) {
    final candidateData = candidateSnapshot?.data() ?? {};
    final fullName = candidateData['fullName'] ?? 'Candidate';
    final profession = candidateData['profession'] ?? 'N/A';
    final country = candidateData['country'] ?? 'Unknown';
    final isHired = candidateData['isHired'] ?? false;
    final hirePaid = candidateData['hirePaid'] ?? false;
    final documentsUnlocked = candidateData['documentsUnlocked'] ?? false;
    final interviewScheduled = candidateData['interviewScheduled'] ?? false;
    final interviewStatus = candidateData['interviewStatus'] ?? 'Pending';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          'Candidate Details',
          style: TextStyle(
              fontWeight: FontWeight.w700, fontSize: 18, color: Colors.black87),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeaderCard(fullName, profession, country),
                  const SizedBox(height: 16),
                  _statusChip(
                      'Interview',
                      interviewScheduled ? 'Scheduled' : 'Not Scheduled',
                      interviewScheduled ? Colors.green : Colors.orange),
                  const SizedBox(height: 8),
                  _statusChip('Interview Status', interviewStatus, Colors.blue),
                  const SizedBox(height: 12),
                  if (interviews.isNotEmpty) ...[
                    const Text('Interviews',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    for (var iv in interviews)
                      Card(
                        child: ListTile(
                          title: Text('Interview: ${iv['interviewId'] ?? ''}'),
                          subtitle:
                              Text('Status: ${iv['interviewStatus'] ?? ''}'),
                          trailing: InterviewActions(
                            interviewId: iv['interviewId'] ?? iv['_id'] ?? '',
                            candidateId: widget.candidateId,
                          ),
                        ),
                      ),
                  ],
                  const SizedBox(height: 8),
                  _statusChip('Hired', isHired ? 'Yes' : 'No',
                      isHired ? Colors.green : Colors.grey),
                  const SizedBox(height: 8),
                  _statusChip('Hire Paid', hirePaid ? 'Yes' : 'No',
                      hirePaid ? Colors.green : Colors.orange),
                  const SizedBox(height: 8),
                  _statusChip(
                      'Documents Unlocked',
                      documentsUnlocked ? 'Yes' : 'No',
                      documentsUnlocked ? Colors.green : Colors.orange),
                  const SizedBox(height: 16),
                  _buildActionButtons(
                      isHired: isHired,
                      hirePaid: hirePaid,
                      documentsUnlocked: documentsUnlocked),
                ],
              ),
            ),
    );
  }

  Widget _buildHeaderCard(String name, String title, String country) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 35,
            backgroundColor: Colors.blueAccent,
            child: const Icon(Icons.person, size: 34, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 20)),
              const SizedBox(height: 4),
              Text(title, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 2),
              Text(country,
                  style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          )
        ],
      ),
    );
  }

  Widget _statusChip(String label, String value, Color color) {
    return Row(
      children: [
        Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
        Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8)),
            child: Text(value,
                style: TextStyle(color: color, fontWeight: FontWeight.w600))),
      ],
    );
  }

  Widget _buildActionButtons(
      {required bool isHired,
      required bool hirePaid,
      required bool documentsUnlocked}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ElevatedButton(
          onPressed: isHired
              ? null
              : () async {
                  await _updateCandidate({
                    'isHired': true,
                    'hireDate': Timestamp.now(),
                    'status': 'hired',
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Candidate marked hired.')));
                },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
          child: const Text('Mark as Hired'),
        ),
        const SizedBox(height: 10),
        ElevatedButton(
          onPressed: (!isHired || hirePaid)
              ? null
              : () async {
                  await _updateCandidate({
                    'hirePaid': true,
                    'documentsUnlocked': true,
                    'status': 'deployed',
                    'deploymentDate': Timestamp.now(),
                  });
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text(
                          'Hire payment confirmed and documents unlocked.')));
                },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
          child: const Text('Confirm Hire Payment'),
        ),
        const SizedBox(height: 10),
        ElevatedButton(
          onPressed: (!hirePaid || documentsUnlocked)
              ? null
              : () async {
                  await _updateCandidate({'documentsUnlocked': true});
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Candidate documents unlocked.')));
                },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
          child: const Text('Unlock Documents'),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () async {
            await _updateCandidate({
              'status': 'available',
              'isHired': false,
              'hirePaid': false,
              'documentsUnlocked': false,
            });
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                content: Text('Candidate returned to marketplace.')));
          },
          child: const Text('Return to Marketplace'),
        ),
      ],
    );
  }
}
