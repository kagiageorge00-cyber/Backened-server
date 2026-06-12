import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/candidate_service.dart';

class OpportunitiesScreen extends StatefulWidget {
  final ApiClient api;
  const OpportunitiesScreen({super.key, required this.api});

  @override
  State<OpportunitiesScreen> createState() => _OpportunitiesScreenState();
}

class _OpportunitiesScreenState extends State<OpportunitiesScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _opportunities;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _opportunities = _service.getOpportunities();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _opportunities,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return const Center(
              child: Text('No opportunities available right now.'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title:
                    Text(item['fullName']?.toString() ?? 'Candidate profile'),
                subtitle: Text(item['jobAppliedFor']?.toString() ??
                    item['skills']?.join(', ') ??
                    'No details'),
              ),
            );
          },
        );
      },
    );
  }
}
