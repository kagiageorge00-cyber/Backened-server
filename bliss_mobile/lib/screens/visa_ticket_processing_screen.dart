import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'ticket_booking_screen.dart';
import 'holiday_packages_screen.dart';
import 'visa_application_form_screen.dart';

class VisaTicketProcessingScreen extends StatefulWidget {
  const VisaTicketProcessingScreen({super.key});

  @override
  State<VisaTicketProcessingScreen> createState() =>
      _VisaTicketProcessingScreenState();
}

class _VisaTicketProcessingScreenState
    extends State<VisaTicketProcessingScreen> {
  String selectedModule = '';
  Color get _brandColor => Colors.deepOrangeAccent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bool isDark = theme.brightness == Brightness.dark;
    final backgroundColor = theme.scaffoldBackgroundColor;
    final headerColor = theme.colorScheme.primary;
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: headerColor,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Visa & Travel Solutions'),
          ],
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: selectedModule.isEmpty
          ? _buildModuleSelection(theme, isDark)
          : _buildModuleContent(selectedModule, theme),
    );
  }

  Widget _buildModuleSelection(ThemeData theme, bool isDark) {
    final cardSurface =
        isDark ? const Color(0xFF242424) : theme.colorScheme.surface;
    final headlineColor = isDark ? Colors.white : Colors.black87;
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [_brandColor, _brandColor.withOpacity(0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Global Opportunities Await',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold)),
                SizedBox(height: 6),
                Text(
                    'Visa applications, flight bookings, and holiday packages — all in one place.',
                    style: TextStyle(color: Colors.white70)),
                SizedBox(height: 12),
                Text(
                    'No login required for visa + ticket portal today. Access token support for visa application is coming soon.',
                    style: TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Text('Your Journey',
                  style: theme.textTheme.titleLarge?.copyWith(
                      color: headlineColor, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _moduleCard(
                  'Visa Application',
                  Icons.assignment_ind,
                  'Start your visa process in minutes. We guide you through each step.',
                  Colors.blue, () {
                setState(() => selectedModule = 'visa');
              }, cardSurface, theme),
              const SizedBox(height: 14),
              _moduleCard(
                  'Flight & Tickets',
                  Icons.flight_takeoff,
                  'Book flights with confidence. Compare prices and find the best deals.',
                  Colors.cyan, () {
                setState(() => selectedModule = 'ticket');
              }, cardSurface, theme),
              const SizedBox(height: 14),
              _moduleCard(
                  'Holiday Packages',
                  Icons.beach_access,
                  'Explore curated packages. Relax and enjoy your dream vacation.',
                  Colors.teal, () {
                setState(() => selectedModule = 'holidays');
              }, cardSurface, theme),
              const SizedBox(height: 24),
              Text('Why Choose Us?',
                  style: theme.textTheme.titleLarge?.copyWith(
                      color: headlineColor, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              _benefitRow(Icons.check_circle, 'Fast Processing',
                  '24-48 hour turnaround', theme),
              const SizedBox(height: 8),
              _benefitRow(Icons.security, 'Secure & Verified',
                  'Your data is protected', theme),
              const SizedBox(height: 8),
              _benefitRow(Icons.support_agent, '24/7 Support',
                  'We\'re always here to help', theme),
              const SizedBox(height: 8),
              _benefitRow(Icons.trending_up, 'Success Rate',
                  '98% visa approval rate', theme),
              const SizedBox(height: 32),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _moduleCard(String title, IconData icon, String desc, Color color,
      VoidCallback onTap, Color cardSurface, ThemeData theme) {
    final textColor =
        theme.brightness == Brightness.dark ? Colors.white : Colors.black87;
    return Card(
      color: cardSurface,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: LinearGradient(
              colors: [color.withOpacity(0.16), color.withOpacity(0.05)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 32, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: theme.textTheme.titleMedium?.copyWith(
                            color: textColor, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(desc,
                        style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, color: color, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _benefitRow(
      IconData icon, String title, String subtitle, ThemeData theme) {
    return Row(
      children: [
        Icon(icon, color: _brandColor, size: 24),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: theme.textTheme.bodyLarge
                      ?.copyWith(fontWeight: FontWeight.w600)),
              Text(subtitle,
                  style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant, fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildModuleContent(String module, ThemeData theme) {
    return Stack(
      children: [
        switch (module) {
          'visa' => const VisaApplicationForm(),
          'ticket' => const TicketBookingScreen(),
          'holidays' => const HolidayPackagesScreen(),
          _ => const SizedBox.shrink(),
        },
        Positioned(
          top: 16,
          left: 16,
          child: FloatingActionButton.small(
            backgroundColor: theme.colorScheme.primary,
            onPressed: () => setState(() => selectedModule = ''),
            child: const Icon(Icons.arrow_back),
          ),
        ),
      ],
    );
  }
}
