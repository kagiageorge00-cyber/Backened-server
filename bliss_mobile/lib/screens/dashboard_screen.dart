import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import 'job_marketplace_screen.dart';
import 'candidates_screen.dart';
import 'messages_screen.dart';
import 'home_placeholder_screen.dart';
import 'payments_history_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  // Pages mapped to bottom nav (index order)
  final List<Widget> _pages = [
    const HomePlaceholderScreen(),
    const JobMarketplaceScreen(),
    const CandidatesScreen(),
    const MessagesScreen(),
    const PaymentsHistoryScreen(),
  ];

  void _onItemTapped(int idx) {
    setState(() => _selectedIndex = idx);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Left drawer
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              const DrawerHeader(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.work, size: 36, color: Colors.blue),
                    ),
                    SizedBox(width: 12),
                      Expanded(
                      child: Text(
                        AppConstants.appName,
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              ListTile(
                leading: const Icon(Icons.person),
                title: const Text('Profile'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: open profile
                },
              ),
              ListTile(
                leading: const Icon(Icons.list_alt),
                title: const Text('My Applications'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: navigate to applications
                },
              ),
              ListTile(
                leading: const Icon(Icons.public),
                title: const Text('Countries'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/countries');
                },
              ),
              ListTile(
                leading: const Icon(Icons.payment),
                title: const Text('Payment History'),
                onTap: () {
                  Navigator.pop(context);
                  setState(() => _selectedIndex = 4); // Switch to Payments tab
                },
              ),
              const Spacer(),
              ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Settings'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: navigate to settings
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Logout'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: sign out
                },
              ),
            ],
          ),
        ),
      ),

      // AppBar
      appBar: AppBar(
        title: const Text(AppConstants.appName),
        centerTitle: false,
        elevation: 1,
      ),

      // Body switches according to bottom nav
      body: _pages[_selectedIndex],

      // Bottom navigation bar
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.work), label: 'Jobs'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Candidates'),
          BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Messages'),
          BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet), label: 'Payments'),
        ],
      ),
    );
  }
}
