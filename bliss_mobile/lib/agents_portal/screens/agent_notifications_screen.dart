import 'package:flutter/material.dart';

class AgentNotificationsScreen extends StatelessWidget {
  final String agentId;
  const AgentNotificationsScreen({super.key, required this.agentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Notifications will be loaded from backend server once the notification API integration is complete.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}

