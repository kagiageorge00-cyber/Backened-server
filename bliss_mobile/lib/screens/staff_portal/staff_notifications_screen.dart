import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class StaffNotificationsScreen extends StatelessWidget {
  const StaffNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifs = List.generate(6, (i) => 'Notification ${i + 1}');

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Notifications'),
          ],
        ),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: notifs.length,
        separatorBuilder: (_, __) => const Divider(),
        itemBuilder: (context, idx) {
          return ListTile(
            leading: const Icon(Icons.notifications_none),
            title: Text(notifs[idx]),
            subtitle: const Text('2h ago'),
            onTap: () => Navigator.pushNamed(context, '/staff/notificationDetail', arguments: {'id': idx}),
          );
        },
      ),
    );
  }
}