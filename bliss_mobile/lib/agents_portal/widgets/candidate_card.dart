import 'package:flutter/material.dart';
import '../models/candidate_model.dart';

class CandidateCard extends StatelessWidget {
  final CandidateModel candidate;
  final VoidCallback onTap;

  const CandidateCard({super.key, required this.candidate, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
      elevation: 2,
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: NetworkImage(candidate.photoUrl),
        ),
        title: Text(candidate.fullName),
        subtitle: Text(candidate.skills),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
