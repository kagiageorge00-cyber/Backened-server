import 'package:flutter/material.dart';
import '../constants/colors.dart';

class CandidateListsScreen extends StatelessWidget {
  final String agentId;
  const CandidateListsScreen({super.key, required this.agentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Candidates'),
        backgroundColor: AppColors.primary,
      ),

      body: Center(
          child: Text(
              'Candidate lists will be loaded from backend server.')), // Placeholder
    );
  }
}
