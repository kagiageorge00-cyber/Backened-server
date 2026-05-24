// main.dart
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'agents_dashboard_screen.dart';
import '../constants/colors.dart';

void main() {
  runApp(const AgentsPortalApp());
}

class AgentsPortalApp extends StatelessWidget {
  const AgentsPortalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'bliss connect Agents Portal',
      theme: ThemeData(
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: Colors.grey[100],
      ),
      debugShowCheckedModeBanner: false,
      initialRoute: '/',
      routes: {
        '/': (context) => const AgentLoginScreen(),
        '/agentDashboard': (context) =>
            const AgentDashboardScreen(agentId: 'john123'),
        '/agentCandidates': (context) =>
            const PlaceholderScreen(title: 'Candidates'),
        '/agentEmployers': (context) =>
            const PlaceholderScreen(title: 'Employers'),
        '/agentPayments': (context) =>
            const PlaceholderScreen(title: 'Payments'),
        '/agentSubscription': (context) =>
            const PlaceholderScreen(title: 'Subscription'),
        '/agentNotifications': (context) =>
            const PlaceholderScreen(title: 'Notifications'),
        '/agentProfile': (context) => const PlaceholderScreen(title: 'Profile'),
        '/agentSettings': (context) =>
            const PlaceholderScreen(title: 'Settings'),
        '/privateChatMessages': (context) {
          final args = ModalRoute.of(context)!.settings.arguments
              as Map<String, dynamic>;
          return PrivateChatMessagesScreen(
            chatId: args['chatId'],
            agentId: args['agentId'],
          );
        },
        '/privateChats': (context) {
          final args = ModalRoute.of(context)!.settings.arguments
              as Map<String, dynamic>?;
          return PrivateChatsScreen(agentId: args?['agentId'] ?? 'john123');
        },
        '/adminBroadcast': (context) => const AdminBroadcastScreen(),
      },
    );
  }
}

// ------------------------
// Login Screen (temporary)
// ------------------------
class AgentLoginScreen extends StatelessWidget {
  const AgentLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text('Agent Login'),
          ],
        ),
      ),
      body: Center(
        child: ElevatedButton(
          child: const Text('Login as Agent John'),
          onPressed: () {
            Navigator.pushReplacementNamed(context, '/agentDashboard');
          },
        ),
      ),
    );
  }
}

// ------------------------
// Placeholder Screen
// ------------------------
class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title), backgroundColor: AppColors.primary),
      body: Center(
        child: Text('$title Screen',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
