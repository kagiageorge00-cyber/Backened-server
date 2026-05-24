// widgets/candidate_card.dart
import 'package:flutter/material.dart';
import '../models/candidate_model.dart';

class CandidateCard extends StatelessWidget {
  final Candidate candidate;
  final VoidCallback onSelect;
  final VoidCallback onMessage;

  const CandidateCard({super.key,
    required this.candidate,
    required this.onSelect,
    required this.onMessage,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final secondary = Theme.of(context).colorScheme.secondary;
    final success = Colors.green;
    final error = Colors.red;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEDF3FB), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: primary.withOpacity(0.15),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onSelect,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundImage: NetworkImage(candidate.photoUrl),
                      backgroundColor: primary.withOpacity(0.1),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            candidate.fullName,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: primary,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: secondary),
                              const SizedBox(width: 4),
                              Text(
                                candidate.country,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: Colors.grey.shade700,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Column(
                      children: [
                        IconButton(
                          icon: Icon(Icons.message, color: secondary),
                          onPressed: onMessage,
                          tooltip: 'Message Candidate',
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: onSelect,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          ),
                          child: const Text('Apply'),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildInfoChip(Icons.person, '${candidate.age} years', primary),
                    const SizedBox(width: 8),
                    _buildInfoChip(Icons.wc, candidate.gender, primary),
                    const SizedBox(width: 8),
                    _buildInfoChip(Icons.work, candidate.jobApplied, primary),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.attach_money, size: 18, color: success),
                    const SizedBox(width: 4),
                    Text(
                      'Expected Salary: ${candidate.expectedSalary}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                            color: success,
                          ),
                    ),
                    const SizedBox(width: 16),
                    Icon(
                      candidate.passportStatus == 'Available' ? Icons.check_circle : Icons.cancel,
                      size: 18,
                      color: candidate.passportStatus == 'Available' ? success : error,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Passport: ${candidate.passportStatus}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: candidate.passportStatus == 'Available' ? success : error,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text, Color chipColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: chipColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: chipColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: chipColor,
            ),
          ),
        ],
      ),
    );
  }
}
