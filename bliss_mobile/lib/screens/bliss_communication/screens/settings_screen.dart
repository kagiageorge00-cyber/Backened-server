import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // final service = BlissCommunicationService();
    // String userId = 'user123'; // Replace with logged-in user ID

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Settings"),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: const Text("Mute Notifications"),
            trailing: Switch(
              value: true, // TODO: bind to user preference
              onChanged: (val) {
                // TODO: update user preference in Firestore
              },
            ),
          ),
          ListTile(
            title: const Text("Report User"),
            onTap: () {
              // TODO: navigate to report screen
            },
          ),
          ListTile(
            title: const Text("Delete Chat"),
            onTap: () {
              // TODO: implement deleting all private chats
            },
          ),
          ListTile(
            title: const Text("Preferences"),
            onTap: () {
              // TODO: navigate to preferences/settings page
            },
          ),
        ],
      ),
    );
  }
}
