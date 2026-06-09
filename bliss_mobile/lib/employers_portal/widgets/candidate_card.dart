import 'package:flutter/material.dart';

class CandidateCard extends StatelessWidget {
  final String id;
  final String name;
  final String age;
  final String country;
  final String experience; // renamed to match your data
  final String salary;
  final String imageUrl;
  final VoidCallback onViewDetails;
  final VoidCallback? onHire;
  final VoidCallback? onSchedule;

  const CandidateCard({
    super.key,
    required this.id,
    required this.name,
    required this.age,
    required this.country,
    required this.experience,
    required this.salary,
    required this.imageUrl,
    required this.onViewDetails,
    this.onHire,
    this.onSchedule,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
        child: Card(
          elevation: 0,
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Candidate profile image with shadow
                Container(
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
                    radius: 36,
                    backgroundImage: NetworkImage(imageUrl),
                    backgroundColor: Colors.grey.shade200,
                  ),
                ),
                const SizedBox(width: 16),

                // Candidate info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$experience • $age yrs • $country • $salary',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 4,
                                )
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: onViewDetails,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue.shade700,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 8,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text(
                                "View Details",
                                style: TextStyle(fontSize: 14),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (onSchedule != null)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 4,
                                  )
                                ],
                              ),
                              child: OutlinedButton(
                                onPressed: onSchedule,
                                style: OutlinedButton.styleFrom(
                                  side:
                                      BorderSide(color: Colors.orange.shade700),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(
                                  "Schedule Interview",
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.orange.shade800,
                                  ),
                                ),
                              ),
                            ),
                          if (onHire != null)
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 4,
                                  )
                                ],
                              ),
                              child: OutlinedButton(
                                onPressed: onHire,
                                style: OutlinedButton.styleFrom(
                                  side:
                                      BorderSide(color: Colors.green.shade700),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 8,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: const Text(
                                  "Hire",
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.green,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      )
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
