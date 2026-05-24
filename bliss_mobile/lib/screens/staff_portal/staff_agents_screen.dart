import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class StaffAgentsScreen extends StatelessWidget {
  const StaffAgentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final agents = List.generate(8, (i) => 'Agent ${i + 1}');

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Agents'),
          ],
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: ListView.separated(
          itemCount: agents.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, idx) {
            return ListTile(
              onTap: () {
                // open agent detail
                Navigator.pushNamed(context, '/staff/agentDetail', arguments: {'agentId': 'agent_${idx+1}'});
              },
              leading: CircleAvatar(backgroundColor: Colors.indigo[100], child: Text('${idx+1}')),
              title: Text(agents[idx], style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('Active • 12 tasks'),
              trailing: const Icon(Icons.chevron_right),
            );
          },
        ),
      ),
    );
  }
}