import 'package:flutter/material.dart';
import '../services/candidate_service.dart';
import '../services/api_client.dart';

class ApplicationsScreen extends StatefulWidget {
  final ApiClient api;
  const ApplicationsScreen({super.key, required this.api});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _applications;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _applications = _service.getApplications();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _applications,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final apps = snapshot.data ?? [];
        if (apps.isEmpty) {
          return const Center(child: Text('No applications found yet.'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: apps.length,
          itemBuilder: (context, index) {
            final item = apps[index];
            final status = item['status']?.toString() ?? 'Unknown';
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(item['jobTitle']?.toString() ?? 'Untitled role'),
                subtitle: Text(item['companyName']?.toString() ?? 'No company'),
                trailing: Chip(label: Text(status)),
              ),
            );
          },
        );
      },
    );
  }
}
