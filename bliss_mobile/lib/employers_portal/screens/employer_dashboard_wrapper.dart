// employer_dashboard_wrapper.dart
import 'package:flutter/material.dart';
import '../../services/backend_auth.dart';
import '../services/employer_api_service.dart';
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

    return FutureBuilder<EmployerProfile?>(
      future: EmployerApiService.fetchEmployerProfile(uid),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(
                child: CircularProgressIndicator(color: Color(0xFF6C4BFF))),
          );
        }

        if (snapshot.hasError || snapshot.data == null) {
          return Scaffold(
            backgroundColor: Colors.black,
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      size: 64, color: Colors.redAccent),
                  const SizedBox(height: 16),
                  const Text('Unable to load employer profile',
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

        final profile = snapshot.data!;

        return StyledEmployerDashboard(
          employerId: uid,
          employerName: profile.contactPerson.isNotEmpty
              ? profile.contactPerson
              : 'Employer',
          companyName:
              profile.companyName.isNotEmpty ? profile.companyName : 'Company',
        );
      },
    );
  }
}
