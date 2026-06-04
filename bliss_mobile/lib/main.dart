import 'package:flutter/material.dart';

import '/screens/home_screen.dart';
import '/screens/apply_screen.dart';
import '/screens/candidate_form_screen.dart';
import '/screens/candidates_portal/candidate_portal_screen.dart';
import '/screens/job_application_page_screen.dart';
import '/screens/admin/admin_screen.dart';

void main() {
  runApp(const ApplyApp());
}

class ApplyApp extends StatelessWidget {
  const ApplyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bliss Connect',

      // ======================
      // THEME
      // ======================
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white,
        useMaterial3: true,
      ),

      // ======================
      // START SCREEN
      // ======================
      initialRoute: '/',

      // ======================
      // ROUTES
      // ======================
      routes: {
        '/': (context) => const HomeScreen(),
        '/home': (context) => const HomeScreen(),
        '/apply': (context) => const ApplyScreen(),
        '/candidate-form': (context) {
          // Extract candidateId from URL query parameters
          final candidateId = Uri.base.queryParameters['candidateId'];
          return CandidateFormScreen(candidateId: candidateId);
        },
        '/jobApplication': (context) => const JobApplicationPageScreen(),
        '/admin': (context) => const AdminScreen(),
        '/candidates': (context) => const CandidatePortalScreen(),
      },

      // ✅ SAFETY (NO CRASH IF ROUTE MISSING)
      onUnknownRoute: (settings) {
        return MaterialPageRoute(
          builder: (_) => const Scaffold(
            body: Center(
              child: Text("Route not found"),
            ),
          ),
        );
      },
    );
  }
}
