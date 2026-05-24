import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'normal_medical_screen.dart';
import 'gamca_medical_screen.dart';

class MedicalMenuScreen extends StatelessWidget {
  const MedicalMenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Medical Booking"),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const NormalMedicalScreen()),
                );
              },
              child: const Text("Book Normal Medical (KES 7,500)"),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const GamcaMedicalScreen()),
                );
              },
              child: const Text("Book GAMCA Medical (USD 25)"),
            ),
          ],
        ),
      ),
    );
  }
}
