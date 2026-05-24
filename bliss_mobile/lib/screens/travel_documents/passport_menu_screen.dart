import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'push_passport_screen.dart';

class PassportMenuScreen extends StatelessWidget {
  const PassportMenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Passport Services"),
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
                  MaterialPageRoute(builder: (_) => const PushPassportScreen()),
                );
              },
              child: const Text("Push Passport"),
            ),
          ],
        ),
      ),
    );
  }
}
