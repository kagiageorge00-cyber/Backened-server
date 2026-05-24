import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'apply_passport_screen.dart';
import 'push_passport_screen.dart';

class PassportApplicationScreen extends StatelessWidget {
  static const routeName = '/passportApplication';

  const PassportApplicationScreen({super.key});

  Widget _buildOptionCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, size: 28, color: Colors.blue),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Passport Menu"),
          ],
        ),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 20),
          _buildOptionCard(
            context: context,
            icon: Icons.create_outlined,
            title: "Apply Passport",
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ApplyPassportScreen()),
              );
            },
          ),
          _buildOptionCard(
            context: context,
            icon: Icons.upload_file_outlined,
            title: "Push Passport",
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PushPassportScreen()),
              );
            },
          ),
        ],
      ),
    );
  }
}
