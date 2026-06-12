import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/sidebar.dart';
import '../services/api_client.dart';
import '../services/candidate_service.dart';
import 'applications_screen.dart';
import 'documents_screen.dart';
import 'interviews_screen.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';
import 'opportunities_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  late final ApiClient _api;
  late final CandidateService _candidateService;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = Provider.of<AuthProvider>(context);
    _api = auth.api;
    _candidateService = CandidateService(_api);
  }

  List<String> get _sectionTitles => [
        'Dashboard',
        'Applications',
        'Interviews',
        'Documents',
        'Progress',
        'Messages',
        'Notifications',
        'Opportunities',
        'Profile',
        'Settings',
      ];

  Future<List<Map<String, dynamic>>> _loadDashboardStats() async {
    final applications = await _candidateService.getApplications();
    final interviews = await _candidateService.getInterviews();
    final documents = await _candidateService.getDocuments();
    final notifications = await _candidateService.getNotifications();
    final progress = await _candidateService.getProgress();

    return [
      {
        'label': 'Applications',
        'count': applications.length,
        'icon': Icons.work_outline,
        'color': const Color(0xFF0D47A1),
        'target': 1,
      },
      {
        'label': 'Interviews',
        'count': interviews.length,
        'icon': Icons.video_camera_front,
        'color': const Color(0xFF2E7D32),
        'target': 2,
      },
      {
        'label': 'Documents',
        'count': documents.length,
        'icon': Icons.description_outlined,
        'color': const Color(0xFFD32F2F),
        'target': 3,
      },
      {
        'label': 'Notifications',
        'count': notifications.length,
        'icon': Icons.notifications_none,
        'color': const Color(0xFFF57C00),
        'target': 6,
      },
      {
        'label': 'Progress',
        'count': int.tryParse(progress['progress']?.toString() ?? '0') ?? 0,
        'icon': Icons.timeline,
        'color': const Color(0xFF5E35B1),
        'target': 4,
      },
    ];
  }

  Widget _buildDashboardHome(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _loadDashboardStats(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text('Unable to load dashboard: ${snapshot.error}'),
              ],
            ),
          );
        }

        final stats = snapshot.data ?? [];
        final auth = Provider.of<AuthProvider>(context);
        final userName = auth.user?.fullName.isNotEmpty == true
            ? auth.user!.fullName
            : 'Candidate';

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0D47A1), Color(0xFF1A237E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back, $userName!',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'A connected candidate portal for interviews, documents, and real-time updates.',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white.withOpacity(0.92),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Overview',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.12,
                ),
                itemCount: stats.length,
                itemBuilder: (context, index) {
                  final stat = stats[index];
                  return StatCard(
                    label: stat['label'] as String,
                    count: stat['count'] as int,
                    icon: stat['icon'] as IconData,
                    color: stat['color'] as Color,
                    onTap: () =>
                        setState(() => _selectedIndex = stat['target'] as int),
                  );
                },
              ),
              const SizedBox(height: 32),
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  _QuickActionButton(
                    icon: Icons.work_outline,
                    label: 'Applications',
                    onTap: () => setState(() => _selectedIndex = 1),
                  ),
                  _QuickActionButton(
                    icon: Icons.video_camera_front,
                    label: 'Interviews',
                    onTap: () => setState(() => _selectedIndex = 2),
                  ),
                  _QuickActionButton(
                    icon: Icons.description_outlined,
                    label: 'Documents',
                    onTap: () => setState(() => _selectedIndex = 3),
                  ),
                  _QuickActionButton(
                    icon: Icons.person,
                    label: 'Profile',
                    onTap: () => setState(() => _selectedIndex = 8),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 1,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Pro tip',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 12),
                      Text(
                        'Accept interviews early and keep your documents updated to build trust with employers.',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _renderSection() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboardHome(context);
      case 1:
        return ApplicationsScreen(api: _api);
      case 2:
        return InterviewsScreen(api: _api);
      case 3:
        return DocumentsScreen(api: _api);
      case 4:
        return FutureBuilder<Map<String, dynamic>>(
          future: _candidateService.getProgress(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            final progress = snapshot.data?['progress']?.toString() ?? '0';
            return Center(
              child: Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Your progress',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '$progress%',
                        style: const TextStyle(
                            fontSize: 48, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      case 5:
        return MessagesScreen(api: _api);
      case 6:
        return NotificationsScreen(api: _api);
      case 7:
        return OpportunitiesScreen(api: _api);
      case 8:
        return ProfileScreen(api: _api);
      case 9:
        return const SettingsScreen();
      default:
        return const Center(child: Text('Section not found'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 768;
    return Scaffold(
      appBar: isMobile
          ? AppBar(
              title: Text(_sectionTitles[_selectedIndex]),
              backgroundColor: const Color(0xFF0D47A1),
              elevation: 0,
            )
          : null,
      drawer: isMobile
          ? Sidebar(
              selectedIndex: _selectedIndex,
              onSelect: (index) {
                setState(() => _selectedIndex = index);
                Navigator.pop(context);
              },
            )
          : null,
      body: isMobile
          ? _renderSection()
          : Row(
              children: [
                SizedBox(
                  width: 280,
                  child: Sidebar(
                    selectedIndex: _selectedIndex,
                    onSelect: (index) => setState(() => _selectedIndex = index),
                  ),
                ),
                Expanded(child: _renderSection()),
              ],
            ),
    );
  }
}

class StatCard extends StatelessWidget {
  final String label;
  final int count;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.count,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: color.withOpacity(0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 14),
            Text(
              '$count',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF0D47A1),
          elevation: 2,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          side: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        onPressed: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 28, color: const Color(0xFF0D47A1)),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
