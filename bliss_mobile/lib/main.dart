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

  // ✅ PARSE INITIAL ROUTE FROM URL (handles query parameters)
  String _getInitialRoute() {
    try {
      final uri = Uri.parse(Uri.base.toString());
      final fragment =
          uri.fragment; // Gets the hash part (#/candidate-form?phone=...)

      if (fragment.isNotEmpty) {
        // Fragment is like '/candidate-form?phone=...'
        if (fragment.contains('/candidate-form')) {
          return '/candidate-form';
        } else if (fragment.contains('/apply')) {
          return '/apply';
        } else if (fragment.contains('/admin')) {
          return '/admin';
        } else if (fragment.contains('/candidates')) {
          return '/candidates';
        } else if (fragment.contains('/jobApplication')) {
          return '/jobApplication';
        }
      }
    } catch (e) {
      debugPrint('Error parsing initial route: $e');
    }
    return '/';
  }

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
      // START SCREEN - ✅ DYNAMICALLY DETERMINE FROM URL
      // ======================
      initialRoute: _getInitialRoute(),

      // ======================
      // ROUTES
      // ======================
      routes: {
        '/': (context) => const HomeScreen(),
        '/home': (context) => const HomeScreen(),
        '/apply': (context) => const ApplyScreen(),
        '/candidate-form': (context) {
          // ✅ Extract query parameters from URL
          final candidateId = Uri.base.queryParameters['candidateId'];
          final phone = Uri.base.queryParameters['phone'];
          return CandidateFormScreen(
            candidateId: candidateId,
            phone: phone,
          );
        },
        '/jobApplication': (context) => const JobApplicationPageScreen(),
        '/admin': (context) => const AdminScreen(),
        '/candidates': (context) => const CandidatePortalScreen(),
      },

      // ✅ SAFETY (NO CRASH IF ROUTE MISSING)
      onUnknownRoute: (settings) {
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text("Route not found: ${settings.name}"),
            ),
          ),
        );
      },
    );
  }
}
