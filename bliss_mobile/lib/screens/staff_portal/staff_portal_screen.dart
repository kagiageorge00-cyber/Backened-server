import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'staff_notifications_screen.dart';
import 'payments_screen.dart';
import 'marketing/marketing_screen.dart';
import 'communication_screen.dart';
import 'reports_screen.dart';
import 'settings_screen.dart';
import 'training_screen.dart';
import '../../screens/backend_monitor_screen.dart';

class StaffPortalScreen extends StatefulWidget {
  final String role;
  final String displayName;
  final String? initialTab;

  const StaffPortalScreen({
    super.key,
    required this.role,
    required this.displayName,
    this.initialTab,
  });

  @override
  State<StaffPortalScreen> createState() => _StaffPortalScreenState();
}

class _StaffPortalScreenState extends State<StaffPortalScreen> {
  late int _selectedIndex;
  late List<Widget> _tabs;
  late List<Map<String, dynamic>> _navItems;

  @override
  void initState() {
    super.initState();
    _selectedIndex = 0;
    _initializeNavigationItems();

    if (widget.initialTab != null) {
      final tabKey = widget.initialTab!.toLowerCase();
      final idx = _navItems.indexWhere((m) => (m['label'] as String).toLowerCase() == tabKey);
      if (idx != -1) _selectedIndex = idx;
    }
  }

  void _initializeNavigationItems() {
    if (widget.role == 'admin') {
      _tabs = [
        const DashboardScreen(),
        const StaffNotificationsScreen(),
        const PaymentsScreen(),
        const MarketingScreen(),
        CommunicationScreen(uid: widget.displayName, name: widget.displayName, role: widget.role),
        const ReportsScreen(),
        const TrainingScreen(),
        const BackendMonitorScreen(),
        const SettingsScreen(),
      ];

      _navItems = [
        {'icon': Icons.dashboard, 'label': 'Dashboard'},
        {'icon': Icons.notifications, 'label': 'Notifications'},
        {'icon': Icons.payment, 'label': 'Payments'},
        {'icon': Icons.campaign, 'label': 'Marketing'},
        {'icon': Icons.chat, 'label': 'Communication'},
        {'icon': Icons.bar_chart, 'label': 'Reports'},
        {'icon': Icons.school, 'label': 'Training'},
        {'icon': Icons.computer, 'label': 'Backend'},
        {'icon': Icons.settings, 'label': 'Settings'},
      ];
    } else {
      _tabs = [
        const DashboardScreen(),
        const StaffNotificationsScreen(),
        CommunicationScreen(uid: widget.displayName, name: widget.displayName, role: widget.role),
        const TrainingScreen(),
        const SettingsScreen(),
      ];

      _navItems = [
        {'icon': Icons.dashboard, 'label': 'Dashboard'},
        {'icon': Icons.notifications, 'label': 'Notifications'},
        {'icon': Icons.chat, 'label': 'Communication'},
        {'icon': Icons.school, 'label': 'Training'},
        {'icon': Icons.settings, 'label': 'Settings'},
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: _buildAppBar(),
      body: Stack(
        children: [
          _buildBackgroundDecorations(),
          _tabs[_selectedIndex],
        ],
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
      drawer: _buildDrawer(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final appBarColor = Theme.of(context).appBarTheme.backgroundColor ?? Theme.of(context).primaryColor;
    final fgColor = Theme.of(context).appBarTheme.foregroundColor ?? Colors.white;
    return AppBar(
      elevation: 0,
      backgroundColor: appBarColor,
      foregroundColor: fgColor,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Staff Portal', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
          Text(
            widget.displayName,
            style: TextStyle(fontSize: 12, color: fgColor.withOpacity(0.8)),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {
            setState(() => _selectedIndex = 1);
          },
        ),
        PopupMenuButton<String>(
          onSelected: (String result) {
            if (result == 'logout') {
              _handleLogout();
            } else if (result == 'profile') {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile feature coming soon')));
            } else if (result == 'help') {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Help feature coming soon')));
            }
          },
          itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
            const PopupMenuItem(value: 'profile', child: Text('Profile')),
            const PopupMenuItem(value: 'help', child: Text('Help')),
            const PopupMenuDivider(),
            const PopupMenuItem(value: 'logout', child: Text('Logout', style: TextStyle(color: Colors.red))),
          ],
        ),
      ],
    );
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/');
            },
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildBackgroundDecorations() {
    return Stack(
      children: [
        Positioned(
          top: -120,
          right: -120,
          child: Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [const Color(0xFF6366F1).withOpacity(0.1), const Color(0xFF8B5CF6).withOpacity(0.05)],
              ),
            ),
          ),
        ),
        Positioned(
          bottom: -150,
          left: -150,
          child: Container(
            width: 320,
            height: 320,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [const Color(0xFF8B5CF6).withOpacity(0.08), const Color(0xFF06B6D4).withOpacity(0.04)],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 12, offset: Offset(0, -4))]),
      child: BottomNavigationBar(
        currentIndex: _selectedIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF6366F1),
        unselectedItemColor: Colors.grey,
        elevation: 0,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: _navItems
            .map((item) => BottomNavigationBarItem(icon: Icon(item['icon'] as IconData), label: item['label'] as String))
            .toList(),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Container(
        color: const Color(0xFFF8F9FA),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.2)),
                    child: const Icon(Icons.admin_panel_settings, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  Text(widget.displayName, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Role: ${widget.role.toUpperCase()}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            ..._navItems.asMap().entries.map(
              (entry) => _buildDrawerItem(index: entry.key, icon: entry.value['icon'] as IconData, title: entry.value['label'] as String),
            ),
            const Padding(padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16), child: Divider(height: 1)),
            _buildDrawerItem(index: -1, icon: Icons.logout, title: 'Logout'),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required int index,
    required IconData icon,
    required String title,
  }) {
    final isSelected = index == _selectedIndex;
    return ListTile(
      leading: Icon(icon, color: isSelected ? const Color(0xFF6366F1) : Colors.grey),
      title: Text(title, style: TextStyle(color: isSelected ? const Color(0xFF6366F1) : Colors.black87, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500)),
      selected: isSelected,
      selectedTileColor: const Color(0xFF6366F1).withOpacity(0.1),
      onTap: () {
        if (index == -1) {
          Navigator.pop(context);
          _handleLogout();
        } else {
          setState(() => _selectedIndex = index);
          Navigator.pop(context);
        }
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}