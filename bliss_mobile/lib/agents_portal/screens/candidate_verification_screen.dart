import 'package:flutter/material.dart';
import '../models/candidate_model.dart';
import '../services/firestore_service.dart';
import '../constants/colors.dart';

class CandidateVerificationScreen extends StatefulWidget {
  final CandidateModel candidate;
  const CandidateVerificationScreen({super.key, required this.candidate});

  @override
  State<CandidateVerificationScreen> createState() => _CandidateVerificationScreenState();
}

class _CandidateVerificationScreenState extends State<CandidateVerificationScreen> {
  bool _processing = false;

  Future<void> _approveCandidate() async {
    setState(() {
      _processing = true;
    });
    await FirestoreService().updateCandidateStatus(widget.candidate.candidateId, 'approved');
    setState(() {
      _processing = false;
    });
    Navigator.pop(context);
  }

  Future<void> _rejectCandidate() async {
    setState(() {
      _processing = true;
    });
    await FirestoreService().updateCandidateStatus(widget.candidate.candidateId, 'rejected');
    setState(() {
      _processing = false;
    });
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify Candidate'),
        backgroundColor: AppColors.primary,
      ),
      body: Center(
        child: _processing
            ? const CircularProgressIndicator()
            : Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Verify ${widget.candidate.fullName}?', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 32),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 8,
                          )
                        ],
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _approveCandidate,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Approve', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 8,
                          )
                        ],
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _rejectCandidate,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Reject', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
