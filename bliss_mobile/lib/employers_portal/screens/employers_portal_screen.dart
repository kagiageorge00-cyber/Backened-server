// lib/employers_portal/screens/employers_portal_screen.dart
import 'package:flutter/material.dart';
import 'styled_employer_dashboard.dart';
import 'employer_post_job_screen.dart';
import 'employer_candidates_screen.dart';
import 'employer_communication_screen.dart';
import 'company_profile_edit_screen.dart';
import 'package:provider/provider.dart';
import '../../theme_notifier.dart';
import '../../screens/support_screen.dart';

class EmployersPortalScreen extends StatefulWidget {
  final String employerId;
  final String employerName;
  final String companyName;

  const EmployersPortalScreen({
    super.key,
    required this.employerId,
    required this.employerName,
    required this.companyName,
  });

  @override
  State<EmployersPortalScreen> createState() => _EmployersPortalScreenState();
}

class _EmployersPortalScreenState extends State<EmployersPortalScreen> {
  int _selectedIndex = 0;

  late List<Widget> _screens;
  final List<String> _titles = [
    'Dashboard',
    'Post Job',
    'Candidates',
    'Communication',
    'Company Profile',
    'Support',
  ];

  @override
  void initState() {
    super.initState();
    _screens = [
      StyledEmployerDashboard(
        employerId: widget.employerId,
        employerName: widget.employerName,
        companyName: widget.companyName,
      ),
      EmployerPostJobScreen(
        employerId: widget.employerId,
        employerName: widget.employerName,
        companyName: widget.companyName,
      ),
      EmployerCandidatesScreen(
        employerId: widget.employerId,
      ),
      EmployerCommunicationScreen(
        employerId: widget.employerId,
        employerName: widget.employerName,
      ),
      const CompanyProfileEditScreen(),
      const SupportScreen(),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF4B7BEC), Color(0xFF3867D6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(color: Colors.transparent),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundImage:
                        AssetImage('assets/images/company_logo.png'),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.companyName,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    '${widget.employerName}@email.com',
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                  const SizedBox(height: 3),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      "Deploy as Company",
                      style: TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard, color: Colors.white),
              title: const Text('Dashboard',
                  style: TextStyle(color: Colors.white)),
              onTap: () => _onItemTapped(0),
            ),
            ListTile(
              leading: const Icon(Icons.post_add, color: Colors.white),
              title:
                  const Text('Post Job', style: TextStyle(color: Colors.white)),
              onTap: () => _onItemTapped(1),
            ),
            ListTile(
              leading: const Icon(Icons.people, color: Colors.white),
              title: const Text('Candidates',
                  style: TextStyle(color: Colors.white)),
              onTap: () => _onItemTapped(2),
            ),
            ListTile(
              leading: const Icon(Icons.chat, color: Colors.white),
              title: const Text('Communication',
                  style: TextStyle(color: Colors.white)),
              onTap: () => _onItemTapped(3),
            ),
            ListTile(
              leading: const Icon(Icons.business, color: Colors.white),
              title: const Text('Company Profile',
                  style: TextStyle(color: Colors.white)),
              onTap: () => _onItemTapped(4),
            ),
            ListTile(
              leading: const Icon(Icons.support, color: Colors.white),
              title:
                  const Text('Support', style: TextStyle(color: Colors.white)),
              onTap: () => _onItemTapped(5),
            ),
            const Divider(color: Colors.white38),
            Consumer<ThemeNotifier>(
              builder: (context, themeNotifier, child) => ListTile(
                leading: Icon(
                  themeNotifier.isDarkMode ? Icons.light_mode : Icons.dark_mode,
                  color: Colors.white,
                ),
                title: Text(
                  themeNotifier.isDarkMode ? 'Light Theme' : 'Dark Theme',
                  style: const TextStyle(color: Colors.white),
                ),
                onTap: () => themeNotifier.toggleTheme(),
              ),
            ),
            const Divider(color: Colors.white38),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.white),
              title:
                  const Text('Logout', style: TextStyle(color: Colors.white)),
              onTap: () {
                // TODO: Implement logout functionality
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _buildDrawer(),
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        backgroundColor: const Color(0xFF3867D6),
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.chat, color: Colors.white),
            onPressed: () => _onItemTapped(3), // Communication screen
          ),
        ],
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: const Color(0xFF3867D6),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(
              icon: Icon(Icons.post_add), label: 'Post Job'),
          BottomNavigationBarItem(
              icon: Icon(Icons.people), label: 'Candidates'),
          BottomNavigationBarItem(
              icon: Icon(Icons.chat), label: 'Communication'),
          BottomNavigationBarItem(icon: Icon(Icons.business), label: 'Profile'),
        ],
      ),
    );
  }
}

/// Temporary placeholder for Payments tab
class PaymentsPlaceholderScreen extends StatelessWidget {
  final String employerId;
  const PaymentsPlaceholderScreen({super.key, required this.employerId});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ElevatedButton(
        onPressed: () {
          Navigator.pushNamed(
            context,
            '/payments',
            arguments: {
              'employerId': employerId,
            },
          );
        },
        child: const Text('Open Payments'),
      ),
    );
  }
}
