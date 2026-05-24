import 'package:flutter/material.dart';

class ApplicantCard extends StatelessWidget {
  final String name;
  final String age;
  final String country;
  final String profession;
  final String status; // Applied, Interview Scheduled, Hired, Pending
  final String imageUrl;
  final VoidCallback onViewDetails;
  final VoidCallback? onScheduleInterview;
  final VoidCallback? onHire;

  const ApplicantCard({
    super.key,
    required this.name,
    required this.age,
    required this.country,
    required this.profession,
    required this.status,
    required this.imageUrl,
    required this.onViewDetails,
    this.onScheduleInterview,
    this.onHire,
  });

  Color _statusColor() {
    switch (status.toLowerCase()) {
      case 'applied':
        return Colors.orange.shade700;
      case 'interview scheduled':
        return Colors.blue.shade700;
      case 'hired':
        return Colors.green.shade700;
      case 'pending':
        return Colors.red.shade700;
      default:
        return Colors.grey.shade600;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundImage: NetworkImage(imageUrl),
              backgroundColor: Colors.grey.shade200,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$profession • $age yrs • $country',
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: _statusColor().withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                              color: _statusColor(),
                              fontWeight: FontWeight.bold,
                              fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: onViewDetails,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade700,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 8),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text(
                          "View Details",
                          style: TextStyle(fontSize: 14),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (onScheduleInterview != null)
                        OutlinedButton(
                          onPressed: onScheduleInterview,
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.orange.shade700),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            "Interview",
                            style: TextStyle(
                                fontSize: 14, color: Colors.orange.shade700),
                          ),
                        ),
                      if (onHire != null)
                        OutlinedButton(
                          onPressed: onHire,
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.green.shade700),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            "Hire",
                            style: TextStyle(
                                fontSize: 14, color: Colors.green.shade700),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
