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
    NavItem('Apply Job', Icons.work, '/apply', const Color(0xFF6366F1)),
    NavItem('Candidates Portal', Icons.people, '/candidates',
        const Color(0xFFF59E0B)),
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

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
          icon: Icon(Icons.menu, color: Theme.of(context).colorScheme.primary),
          onPressed: () {
            scaffoldKey.currentState?.openDrawer();
          },
        ),
        title: const Logo(height: 45, width: 45, fit: BoxFit.contain),
        centerTitle: true,
        actions: [],
      ),
      drawer: Drawer(child: _buildSidebar()),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Video Section - Enlarged
            Padding(
              padding: const EdgeInsets.all(16),
              child: const ImageSlider(),
            ),
            // Quick Access Apps Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick Access',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
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
            decoration: const BoxDecoration(color: Color(0xFF0F172A)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(
                  height: 50,
                  child: Logo(height: 50, width: 50, fit: BoxFit.contain),
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
          _sidebarMenuItem(Icons.people, "Candidates Portal", "/candidates"),
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
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
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
                      style: TextStyle(color: Colors.white, fontSize: 14),
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

  ListTile _sidebarMenuItem(IconData icon, String label, String route) {
    return ListTile(
      leading: Icon(icon, color: Colors.white70),
      title: Text(
        label,
        style: const TextStyle(color: Colors.white, fontSize: 14),
      ),
      onTap: () {
        // Close the drawer first
        Navigator.pop(context);

        // Map special labels to concrete screens using MaterialPageRoute
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
                  'Please carefully read and agree to all terms and policies before submitting your job application. By clicking "Agree & Continue", you confirm your understanding and acceptance of these terms.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: Colors.blue.shade700,
                      ),
                ),
                const SizedBox(height: 16),
                _buildTermsSection(
                  context,
                  '1. Application Authenticity & Accuracy',
                  'You certify that all information provided in your application is true, complete, and accurate. You understand that providing false, misleading, or fraudulent information may result in immediate disqualification, legal action, and blacklisting from our platform. All documents submitted must be valid government-issued or officially recognized credentials.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '2. Data Privacy & Information Protection',
                  'Bliss Connect collects and processes your personal information in compliance with GDPR, CCPA, and applicable international data protection laws. Your data will be used exclusively for recruitment, visa processing, and related employment services. We encrypt all sensitive information and do not share your data with third parties without explicit written consent. You have the right to access, correct, or request deletion of your personal data at any time.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '3. Application Processing & Communication',
                  'You authorize Bliss Connect and partner employers/agents to contact you via email, phone, SMS, or video call regarding your application status. Processing times vary by role and location (typically 5-30 business days). You agree to respond promptly to interview requests and hiring communications. Failure to respond within 7 days may result in application cancellation.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '4. Visa & Travel Documentation Requirements',
                  'If applying for international positions, you acknowledge visa requirements and associated costs. You confirm eligibility to work in the destination country and will provide all required documentation (passport, health certificates, police clearance). Bliss Connect provides guidance but does not guarantee visa approval. Visa denial is not grounds for refund of processing fees.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '5. Processing Fees & Payment Terms',
                  'Certain positions and services incur processing fees (typically 10-15% of first month salary). Fees are paid in advance and cover application review, document verification, and initial visa consultation. Fees are non-refundable unless the employer cancels the position. You agree to pay via M-Pesa, bank transfer, or credit card as offered on our platform.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '6. Equal Opportunity & Non-Discrimination',
                  'Bliss Connect is an equal opportunity employer platform. We do not discriminate based on race, religion, gender, age, disability, or sexual orientation. Any discriminatory content in applications will be reported to relevant authorities. You agree not to make false discrimination claims without evidence.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '7. Limitation of Liability',
                  'Bliss Connect does not guarantee employment or successful visa approval. We are not responsible for employer decisions, contract disputes, or unfulfilled promises. We act as a platform connector only. Maximum liability is limited to fees paid by applicants.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '8. Platform Rules & Conduct',
                  'You agree to use Bliss Connect for legitimate job seeking only. Prohibited activities include fraud, harassment, spamming, hacking, or misuse of platform features. Violations will result in immediate account suspension and legal consequences. You may not post offensive, discriminatory, or unlawful content.',
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Disagree',
                  style: TextStyle(
                      color: Colors.red,
                      fontSize: 16,
                      fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.pushNamed(context, '/apply');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text(
                'Agree & Continue',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTermsSection(
      BuildContext context, String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.bold, color: Colors.indigo),
        ),
        const SizedBox(height: 6),
        Text(
          content,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                height: 1.5,
                color: Colors.grey.shade700,
              ),
          textAlign: TextAlign.justify,
        ),
      ],
    );
  }

  Widget _buildQuickAccessGrid(bool isMobile) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: isMobile ? 2.0 : 4.0,
      children: navItems.map((item) {
        return _QuickAccessCard(
          item: item,
          onTap: () {
            if (item.label == 'Apply Job') {
              _showTermsAndPoliciesDialog();
            } else {
              Navigator.pushNamed(context, item.route);
            }
          },
        );
      }).toList(),
    );
  }
}

class _QuickAccessCard extends StatefulWidget {
  final NavItem item;
  final VoidCallback onTap;

  const _QuickAccessCard({required this.item, required this.onTap});

  @override
  State<_QuickAccessCard> createState() => _QuickAccessCardState();
}

class _QuickAccessCardState extends State<_QuickAccessCard> {
  bool _hover = false;
  bool _pressed = false;

  void _onEnter(bool hover) => setState(() => _hover = hover);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final blue = const Color(0xFF0D47A1);
    final color = widget.item.color;

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
          curve: Curves.easeOut,
          child: Material(
            color: Colors.white,
            elevation: 2,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withAlpha(13),
                      blurRadius: 8,
                      offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withAlpha(20),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      widget.item.icon,
                      color: color == Colors.transparent ? blue : color,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Title
                  Text(
                    widget.item.label,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Colors.grey.shade900,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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

  NavItem(this.label, this.icon, this.route, this.color);
}
