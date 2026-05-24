import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'normal_medical_screen.dart';
import 'gamca_medical_screen.dart';

class MedicalApplicationScreen extends StatelessWidget {
  static const routeName = '/medicalApplication';

  const MedicalApplicationScreen({super.key});

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
        leading: Icon(icon, size: 28, color: Colors.green),
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
            Text("Medical Menu"),
          ],
        ),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 20),
          _buildOptionCard(
            context: context,
            icon: Icons.local_hospital_outlined,
            title: "Normal Medical",
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NormalMedicalScreen()),
              );
            },
          ),
          _buildOptionCard(
            context: context,
            icon: Icons.medical_services_outlined,
            title: "GAMCA Medical",
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const GamcaMedicalScreen()),
              );
            },
          ),
        ],
      ),
    );
  }
}
