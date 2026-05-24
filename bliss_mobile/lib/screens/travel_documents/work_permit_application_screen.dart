import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'work_permit_form_screen.dart';

class WorkPermitApplicationScreen extends StatelessWidget {
  static const routeName = '/workPermitApplication';

  const WorkPermitApplicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Work Permit Application"),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Documents Required to Apply for Work Permit:",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            const Text("1. Passport Copy (photo page)"),
            const Text("2. Passport Bio Data details"),
            const Text("3. Passport-sized photograph"),
            const Text("4. Employment contract / offer letter"),
            const Text("5. Educational certificates (if required)"),
            const Text("6. Any other supporting documents for work permit"),
            const SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const WorkPermitFormScreen(),
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
