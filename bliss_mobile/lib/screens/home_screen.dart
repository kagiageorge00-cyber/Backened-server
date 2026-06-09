// lib/screens/home_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../widgets/image_slider.dart';
import '../widgets/logo.dart';
import '../theme_notifier.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

  final List<NavItem> navItems = [
    NavItem(
      'Apply Job',
      Icons.work,
      '/apply',
      const Color(0xFF6366F1),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 768;

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.menu,
            color: Theme.of(context).colorScheme.primary,
          ),
          onPressed: () {
            scaffoldKey.currentState?.openDrawer();
          },
        ),
        title: const Logo(
          height: 45,
          width: 45,
          fit: BoxFit.contain,
        ),
        centerTitle: true,
      ),
      drawer: Drawer(
        child: _buildSidebar(),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: const ImageSlider(),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick Access',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  _buildQuickAccessGrid(isMobile),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
      ),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: Color(0xFF0F172A),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(
                  height: 50,
                  child: Logo(
                    height: 50,
                    width: 50,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your Opportunity Portal',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          _sidebarMenuItem(Icons.home, "Home", "/home"),
          _sidebarMenuItem(Icons.work, "Apply Job", "/apply"),
          const Divider(color: Colors.white24),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Consumer<ThemeNotifier>(
              builder: (context, themeNotifier, _) {
                return Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    leading: Icon(
                      themeNotifier.isDarkMode
                          ? Icons.dark_mode
                          : Icons.light_mode,
                      color: themeNotifier.isDarkMode
                          ? Colors.amber
                          : Colors.orange,
                    ),
                    title: const Text(
                      'Dark Mode',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                    trailing: Switch(
                      value: themeNotifier.isDarkMode,
                      onChanged: (value) {
                        themeNotifier.setDarkMode(value);
                      },
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  ListTile _sidebarMenuItem(
    IconData icon,
    String label,
    String route,
  ) {
    return ListTile(
      leading: Icon(
        icon,
        color: Colors.white70,
      ),
      title: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
        ),
      ),
      onTap: () {
        Navigator.pop(context);
        Navigator.pushNamed(context, route);
      },
    );
  }

  void _showTermsAndPoliciesDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Bliss Connect Terms & Policies'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView(
              shrinkWrap: true,
              children: [
                Text(
                  'Please carefully read and agree to all terms and policies before submitting your job application.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: Colors.blue.shade700,
                      ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Disagree',
                style: TextStyle(
                  color: Colors.red,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.pushNamed(context, '/apply');
              },
              child: const Text('Agree & Continue'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildQuickAccessGrid(bool isMobile) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 1,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: isMobile ? 2.0 : 4.0,
      children: navItems.map((item) {
        return _QuickAccessCard(
          item: item,
          onTap: () {
            _showTermsAndPoliciesDialog();
          },
        );
      }).toList(),
    );
  }
}

class _QuickAccessCard extends StatefulWidget {
  final NavItem item;
  final VoidCallback onTap;

  const _QuickAccessCard({
    required this.item,
    required this.onTap,
  });

  @override
  State<_QuickAccessCard> createState() => _QuickAccessCardState();
}

class _QuickAccessCardState extends State<_QuickAccessCard> {
  bool _hover = false;
  bool _pressed = false;

  void _onEnter(bool hover) {
    setState(() => _hover = hover);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final scale = _pressed ? 0.98 : (_hover ? 1.03 : 1.0);

    return MouseRegion(
      onEnter: (_) => _onEnter(true),
      onExit: (_) => _onEnter(false),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) {
          setState(() => _pressed = false);
          widget.onTap();
        },
        onTapCancel: () => setState(() => _pressed = false),
        child: AnimatedScale(
          scale: scale,
          duration: const Duration(milliseconds: 140),
          child: Material(
            color: Colors.white,
            elevation: 2,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(
                vertical: 14,
                horizontal: 12,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    widget.item.icon,
                    color: widget.item.color,
                    size: 28,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    widget.item.label,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class NavItem {
  final String label;
  final IconData icon;
  final String route;
  final Color color;

  NavItem(
    this.label,
    this.icon,
    this.route,
    this.color,
  );
}
