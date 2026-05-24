import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

// Import individual screens
import 'passport_menu_screen.dart';
import 'birth_certificate_screen.dart';
import 'medical_menu_screen.dart';
import 'invitation_letter_application_screen.dart';
import 'work_permit_application_screen.dart';

class TravelDocumentsScreen extends StatelessWidget {
  const TravelDocumentsScreen({super.key});

  Widget _buildCard({
    required BuildContext ctx,
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(ctx);
    final isDark = theme.brightness == Brightness.dark;
    final cardGradient = isDark
        ? [color.withOpacity(0.28), color.withOpacity(0.18)]
        : [color.withOpacity(0.95), color.withOpacity(0.75)];

    return InkWell(
      onTap: onTap,
      child: Container(
        width: 160,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: cardGradient),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.18 : 0.12),
                blurRadius: 12,
                offset: const Offset(0, 6))
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  shape: BoxShape.circle),
              child: Icon(icon, size: 36, color: Colors.white),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themePrimary = theme.colorScheme.primary;
    final themePrimaryContainer = theme.colorScheme.primaryContainer;
    final surfaceColor = theme.colorScheme.surfaceContainerHighest;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 120, width: 120),
            SizedBox(width: 12),
            Text('Travel Documents'),
          ],
        ),
        centerTitle: true,
        backgroundColor: themePrimary,
        elevation: 2,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Hero banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                    colors: [themePrimary, themePrimaryContainer],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Bliss Connect Travel Documents',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold)),
                        SizedBox(height: 8),
                        Text(
                            'Push Passport, Medical, Birth Certificate, Invitation Letter and Work Permit services using our brand payment flow.',
                            style: TextStyle(color: Colors.white70)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  const SizedBox(
                      width: 120,
                      height: 120,
                      child: Logo(height: 120, width: 120)),
                ],
              ),
            ),

            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Choose a service to proceed',
                      style: theme.textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 0.92,
                    children: [
                      _buildCard(
                        ctx: context,
                        icon: Icons.badge_outlined,
                        title: 'Passport',
                        subtitle: 'Push Passport Only',
                        color: const Color(0xFF3B82F6),
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const PassportMenuScreen())),
                      ),
                      _buildCard(
                        ctx: context,
                        icon: Icons.file_copy_outlined,
                        title: 'Birth Certificate',
                        subtitle: 'KES 7,000 / 3,000',
                        color: const Color(0xFFF59E0B),
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    const BirthCertificateScreen())),
                      ),
                      _buildCard(
                        ctx: context,
                        icon: Icons.medical_services_outlined,
                        title: 'Medical',
                        subtitle: 'Normal / GAMCA',
                        color: const Color(0xFF10B981),
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const MedicalMenuScreen())),
                      ),
                      _buildCard(
                        ctx: context,
                        icon: Icons.mail_outline,
                        title: 'Invitation Letter',
                        subtitle: 'KES 20,000',
                        color: const Color(0xFF6366F1),
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    const InvitationLetterApplicationScreen())),
                      ),
                      _buildCard(
                        ctx: context,
                        icon: Icons.work_outline,
                        title: 'Work Permit',
                        subtitle: 'KES 20,000',
                        color: const Color(0xFF8B5CF6),
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    const WorkPermitApplicationScreen())),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(12)),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Tips for a smooth application',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text('- Ensure documents are clear and legible.',
                              style: theme.textTheme.bodyMedium),
                          Text('- Allow up to 5 business days for processing.',
                              style: theme.textTheme.bodyMedium),
                        ]),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
