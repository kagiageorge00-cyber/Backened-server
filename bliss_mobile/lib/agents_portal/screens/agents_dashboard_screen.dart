import 'package:flutter/material.dart';

class AgentDashboardScreen extends StatelessWidget {
  final String agentId;
  const AgentDashboardScreen({super.key, required this.agentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agent Dashboard'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Agent dashboard is under backend migration. Core metrics and activity feeds will be available once the backend integration is complete.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Theme.of(context).textTheme.bodyLarge?.color,
              fontSize: 16,
            ),
          ),
        ),
      ),
    );
  }
}
