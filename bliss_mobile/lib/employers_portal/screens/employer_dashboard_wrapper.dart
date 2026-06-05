// employer_dashboard_wrapper.dart
import 'package:flutter/material.dart';
import '../../services/backend_auth.dart';
import 'package:bliss_mobile/firebase_stub.dart';

// <-- Update this import to the file that contains your dashboard widget.
// If you used the Mockup 2 code I gave you, the file I suggested was
// `styled_employer_dashboard.dart` which defines `StyledEmployerDashboard`.
import 'styled_employer_dashboard.dart';

// If instead your dashboard class is named MainEmployerDashboard or EmployerDashboard,
// change the import above and the widget below accordingly.

class EmployerDashboardWrapper extends StatelessWidget {
  const EmployerDashboardWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = BackendAuth.userId;

    // If not logged in — redirect to login page
    if (uid == null) {
      Future.microtask(
          () => Navigator.pushReplacementNamed(context, '/employer-login'));

      return const Scaffold(
        backgroundColor: Colors.black,
        body:
            Center(child: CircularProgressIndicator(color: Color(0xFF6C4BFF))),
      );
    }

    // Logged in — load employer profile from Firestore
    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance.collection('employers').doc(uid).get(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(
                child: CircularProgressIndicator(color: Color(0xFF6C4BFF))),
          );
        }

        if (!snapshot.hasData || !snapshot.data!.exists) {
          return Scaffold(
            backgroundColor: Colors.black,
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      size: 64, color: Colors.redAccent),
                  const SizedBox(height: 16),
                  const Text('Employer profile not found',
                      style: TextStyle(color: Colors.white70, fontSize: 18)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => Navigator.pushReplacementNamed(
                        context, '/employer-login'),
                    child: const Text('Return to Login'),
                  ),
                ],
              ),
            ),
          );
        }

        final data = snapshot.data!.data() as Map<String, dynamic>;

        // --- IMPORTANT: change this to match the dashboard class you have ---
        // I used `StyledEmployerDashboard` (from styled_employer_dashboard.dart).
        // If your dashboard class is named `MainEmployerDashboard` or `EmployerDashboard`
        // simply replace `StyledEmployerDashboard` below with that class name,
        // and update the import at the top to point to the correct file.
        return StyledEmployerDashboard(
          employerId: uid,
          employerName:
              (data['name'] ?? data['employerName'] ?? 'Employer') as String,
          companyName:
              (data['companyName'] ?? data['company'] ?? 'Company') as String,
        );
      },
    );
  }
}
