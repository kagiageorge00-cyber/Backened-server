import 'package:flutter/material.dart';

import '/screens/home_screen.dart';
import '/screens/apply_screen.dart';
import '/screens/candidate_form_screen.dart';
import '/screens/job_application_page_screen.dart';
import '/screens/admin/admin_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ApplyApp());
}

class ApplyApp extends StatelessWidget {
  const ApplyApp({super.key});

  String _getInitialRoute() {
    try {
      final uri = Uri.base;
      final path = uri.path;
      final fragment = uri.fragment;

      debugPrint('=================================');
      debugPrint('FULL URL: $uri');
      debugPrint('PATH: $path');
      debugPrint('FRAGMENT: $fragment');
      debugPrint('=================================');

      // Direct path routing
      if (path.startsWith('/candidate-form')) {
        return '/candidate-form';
      }

      if (path.startsWith('/apply')) {
        return '/apply';
      }

      if (path.startsWith('/admin')) {
        return '/admin';
      }

      if (path.startsWith('/jobApplication')) {
        return '/jobApplication';
      }

      // Hash routing support
      String routePart = fragment;

      // Remove query parameters
      if (routePart.contains('?')) {
        routePart = routePart.split('?').first;
      }

      if (!routePart.startsWith('/')) {
        routePart = '/$routePart';
      }

      debugPrint('ROUTE PART: $routePart');

      if (routePart == '/candidate-form' ||
          routePart.startsWith('/candidate-form')) {
        return '/candidate-form';
      }

      if (routePart == '/apply' || routePart.startsWith('/apply')) {
        return '/apply';
      }

      if (routePart == '/admin' || routePart.startsWith('/admin')) {
        return '/admin';
      }

      if (routePart == '/jobApplication' ||
          routePart.startsWith('/jobApplication')) {
        return '/jobApplication';
      }
    } catch (e) {
      debugPrint('Route parse error: $e');
    }

    return '/';
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bliss Connect',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white,
        useMaterial3: true,
      ),
      initialRoute: _getInitialRoute(),
      routes: {
        '/': (context) => const HomeScreen(),
        '/home': (context) => const HomeScreen(),
        '/apply': (context) => const ApplyScreen(),
        '/candidate-form': (context) {
          String? candidateId;
          String? phone;

          try {
            final uri = Uri.base;

            debugPrint('Candidate Form URL: $uri');

            // First try normal query parameters
            candidateId = uri.queryParameters['candidateId'];
            phone = uri.queryParameters['phone'];

            // Then try hash-route query parameters
            if ((candidateId == null || phone == null) &&
                uri.fragment.contains('?')) {
              final queryString =
                  uri.fragment.substring(uri.fragment.indexOf('?') + 1);

              final params = Uri.splitQueryString(queryString);

              candidateId ??= params['candidateId'];
              phone ??= params['phone'];
            }

            debugPrint('candidateId = $candidateId');
            debugPrint('phone = $phone');
          } catch (e) {
            debugPrint('Candidate form parse error: $e');
          }

          return CandidateFormScreen(
            candidateId: candidateId,
            phone: phone,
          );
        },
        '/jobApplication': (context) => const JobApplicationPageScreen(),
        '/admin': (context) => const AdminScreen(),
      },
      onUnknownRoute: (settings) {
        debugPrint('UNKNOWN ROUTE: ${settings.name}');

        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(
              title: const Text('Route Error'),
            ),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Route not found: ${settings.name}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
