import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'invitation_letter_form_screen.dart';

class InvitationLetterApplicationScreen extends StatelessWidget {
  static const routeName = '/invitationLetterApplication';

  const InvitationLetterApplicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Invitation Letter"),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Documents Required to Apply for Invitation Letter:",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            const Text("1. Passport Copy (clear photo page)"),
            const Text("2. Passport Bio Data details"),
            const Text("3. Any previous visa copies (if available)"),
            const Text("4. Purpose of visit details"),
            const SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const InvitationLetterForm(),
                    ),
                  );
                },
                child: const Text("Proceed to Apply"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
