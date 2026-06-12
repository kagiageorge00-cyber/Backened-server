import 'package:go_router/go_router.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

class CandidateRoutes {
  static GoRouter router(AuthProvider auth) => GoRouter(
        refreshListenable: auth,
        initialLocation: '/login',
        redirect: (context, state) {
          final isLoggingIn = state.uri.toString() == '/login';
          if (!auth.isAuthenticated && !isLoggingIn) {
            return '/login';
          }
          if (auth.isAuthenticated && isLoggingIn) {
            return '/';
          }
          return null;
        },
        routes: [
          GoRoute(
              path: '/login', builder: (context, state) => const LoginScreen()),
          GoRoute(
              path: '/', builder: (context, state) => const DashboardScreen()),
        ],
      );
}
