import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class StaffSettingsScreen extends StatelessWidget {
  const StaffSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Staff Settings'),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          SwitchListTile(
            title: const Text('Enable notifications'),
            value: true,
            onChanged: (_) {},
            secondary: const Icon(Icons.notifications),
          ),
          ListTile(
            leading: const Icon(Icons.lock),
            title: const Text('Change password'),
            onTap: () => Navigator.pushNamed(context, '/settings'),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Log out'),
            onTap: () => Navigator.pushReplacementNamed(context, '/'),
          ),
        ],
      ),
    );
  }
}