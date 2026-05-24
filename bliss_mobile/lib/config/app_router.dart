import 'package:flutter/material.dart';
import '../screens/home_screen.dart';
import '../screens/admin/financial_dashboard_screen.dart';
import '../agents_portal/screens/agent_login_screen.dart';
import '../employers_portal/screens/employer_login_screen.dart';

class AppRouter {
  // Simplified router without go_router package
  // TODO: Install go_router when ready and replace this implementation
  
  static Map<String, WidgetBuilder> getRoutes() {
    return {
      '/': (context) => const HomeScreen(),
      '/admin/financial-dashboard': (context) => const FinancialDashboardScreen(),
      '/recruiter/agent/login': (context) => const AgentLoginScreen(),
      '/recruiter/employer/login': (context) => const EmployerLoginScreen(),
      '/customer/bookings': (context) => const BookingHistoryScreen(),
      '/error': (context) => const ErrorScreen(),
    };
  }

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    final routes = getRoutes();
    
    if (routes.containsKey(settings.name)) {
      return MaterialPageRoute(
        builder: routes[settings.name]!,
        settings: settings,
      );
    }
    
    return MaterialPageRoute(builder: (_) => const ErrorScreen());
  }
}

// Placeholder screens
class BookingHistoryScreen extends StatelessWidget {
  const BookingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Booking History Screen')),
    );
  }
}

class ErrorScreen extends StatelessWidget {
  const ErrorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Error')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red),
            SizedBox(height: 16),
            Text('Page not found or access denied'),
          ],
        ),
      ),
    );
  }
}
