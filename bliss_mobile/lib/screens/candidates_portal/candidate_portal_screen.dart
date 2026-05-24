import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:intl/intl.dart';
import 'dart:math';
import 'dart:async';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:bliss_mobile/theme_notifier.dart';
import '../../employers_portal/services/applicants_service.dart';
import '../../employers_portal/models/application_model.dart';
import '../../models/job_model.dart';
import '../../models/candidate_model.dart';
import '../../employers_portal/services/job_service_http.dart';
import '../apply_screen.dart';
import '../payments_screen.dart';
import '../support_screen.dart';

class CandidatePortalScreen extends StatefulWidget {
  const CandidatePortalScreen({super.key});

  @override
  State<CandidatePortalScreen> createState() => _CandidatePortalScreenState();
}

class _CandidatePortalScreenState extends State<CandidatePortalScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late PageController _bannerController;
  Timer? _bannerTimer;

  final List<String> bannerImages = [
    'banner1',
    'banner2',
    'banner3',
    'banner4',
  ];

  String? _candidateId;
  Map<String, dynamic>? _candidateProfile;
  int _currentBannerPage = 0;
  String _jobFilter = 'All';

  // Login Controllers - Persist across rebuilds
  late final TextEditingController loginIdCtrl;
  late final TextEditingController loginPassCtrl;
  late final TextEditingController regNameCtrl;
  late final TextEditingController regPhoneCtrl;
  late final TextEditingController regNextOfKinCtrl;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 9, vsync: this);
    _bannerController = PageController();

    // Initialize controllers
    loginIdCtrl = TextEditingController();
    loginPassCtrl = TextEditingController();
    regNameCtrl = TextEditingController();
    regPhoneCtrl = TextEditingController();
    regNextOfKinCtrl = TextEditingController();

    _loadCandidateSession();
    _startBannerAutoPlay();
  }

  void _startBannerAutoPlay() {
    _bannerTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      setState(() {
        if (_currentBannerPage < bannerImages.length - 1) {
          _currentBannerPage++;
        } else {
          _currentBannerPage = 0;
        }
      });
      _bannerController.animateToPage(
        _currentBannerPage,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  Future<void> _loadCandidateSession() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString('candidateId');
    if (id != null) {
      setState(() => _candidateId = id);
      _loadCandidateProfile(id);
    }
  }

  Future<void> _saveCandidateSession(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('candidateId', id);
    setState(() => _candidateId = id);
    _loadCandidateProfile(id);
  }

  Future<void> _loadCandidateProfile(String id) async {
    final response = await http.post(
      Uri.parse('https://your-backend-url/api/candidate/profile'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'candidateId': id}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      setState(() {
        _candidateId = id;
        _candidateProfile = {
          'name': data['name'] ?? 'Candidate',
          'email': data['email'] ?? '',
          'phone': data['phone'] ?? '',
          'country': data['country'] ?? 'Kenya',
          'photoUrl': data['photoUrl'] ?? '',
          'id': id,
        };
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _bannerController.dispose();
    _bannerTimer?.cancel();

    // Dispose controllers
    loginIdCtrl.dispose();
    loginPassCtrl.dispose();
    regNameCtrl.dispose();
    regPhoneCtrl.dispose();
    regNextOfKinCtrl.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final applicantsService = ApplicantsService();
    final jobService = JobService();

    if (_candidateId == null) {
      return Scaffold(
        appBar: AppBar(
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Logo(height: 72, width: 72),
              SizedBox(width: 8),
              Text('Candidate Portal'),
            ],
          ),
        ),
        body: _buildAuthArea(),
      );
    }

    return DefaultTabController(
      length: 9,
      child: Scaffold(
        body: TabBarView(
          controller: _tabController,
          children: [
            // HOME TAB with full-screen autoplay banners
            _buildHomeTab(applicantsService),
            // MY APPLICATIONS TAB
            _buildApplicationsTab(context, applicantsService, _candidateId!),
            // JOBS MARKETPLACE TAB
            _buildJobsMarketplaceTab(context, jobService),
            // TRAVEL DOCUMENTS TAB
            _buildTravelDocsTab(context),
            // DOCUMENTS TAB
            _buildDocumentsTab(context),
            // INTERVIEWS TAB
            _buildInterviewsTab(context, applicantsService, _candidateId!),
            // MESSAGING TAB
            _buildMessagingTab(context),
            // PROFILE SETTINGS TAB
            _buildProfileSettingsTab(context),
            // SUPPORT TAB
            const SupportScreen(),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            labelColor: Colors.blue,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.blue,
            tabs: const [
              Tab(icon: Icon(Icons.home), text: 'Home'),
              Tab(icon: Icon(Icons.assignment), text: 'My Apps'),
              Tab(icon: Icon(Icons.business), text: 'Employer Market'),
              Tab(icon: Icon(Icons.travel_explore), text: 'Travel'),
              Tab(icon: Icon(Icons.folder), text: 'Docs'),
              Tab(icon: Icon(Icons.video_call), text: 'Interviews'),
              Tab(icon: Icon(Icons.message), text: 'Messages'),
              Tab(icon: Icon(Icons.person), text: 'Profile'),
              Tab(icon: Icon(Icons.support), text: 'Support'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHomeTab(ApplicantsService applicantsService) {
    return StreamBuilder<List<ApplicationModel>>(
      stream: applicantsService.getApplicationsByCandidate(_candidateId ?? ''),
      builder: (context, snapshot) {
        final apps = snapshot.data ?? [];
        final failedApps = apps.where((a) {
          final status = a.applicationStatus.toLowerCase();
          final interview = a.interviewStatus.toLowerCase();
          return status.contains('failed') ||
              status.contains('rejected') ||
              interview.contains('failed');
        }).toList();

        final name = _candidateProfile?['name'] ?? 'Candidate';
        final country = _candidateProfile?['country'] ?? 'Kenya';

        final localApps = apps.where((a) {
          final title = a.jobTitle.toLowerCase();
          return title.contains('local') || title.contains('domestic');
        }).toList();
        final internationalApps = apps.where((a) {
          final title = a.jobTitle.toLowerCase();
          return title.contains('international') ||
              title.contains('overseas') ||
              title.contains('abroad');
        }).toList();
        final inReview = apps
            .where((a) => a.applicationStatus.toLowerCase().contains('pending'))
            .length;

        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Enhanced Header with Gradient
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade900, Colors.blue.shade600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(28),
                      bottomRight: Radius.circular(28)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade800.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withOpacity(0.4),
                              width: 3,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 32,
                            backgroundColor: Colors.white.withOpacity(0.15),
                            backgroundImage: _candidateProfile?['photoUrl'] !=
                                        null &&
                                    _candidateProfile!['photoUrl'].isNotEmpty
                                ? NetworkImage(_candidateProfile!['photoUrl'])
                                    as ImageProvider
                                : const AssetImage(
                                    'assets/images/profile_placeholder.png'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Welcome back, $name! 👋',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5)),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                    'ID: ${_candidateProfile?['id'] ?? _candidateId ?? 'Unknown'} • $country',
                                    style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.blue.shade700,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: () => _tabController.animateTo(7),
                            icon: const Icon(Icons.person_outline),
                            label: const Text('Profile',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white.withOpacity(0.2),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: () {
                              if (_candidateId == null) return;
                              Navigator.pushNamed(
                                  context, '/privateChatDetails',
                                  arguments: {
                                    'chatId':
                                        _getChatId(_candidateId!, 'staff_1'),
                                    'otherUserId': 'staff_1',
                                    'otherUserName': 'Bliss Staff',
                                    'otherUserAvatar': '',
                                  });
                            },
                            icon: const Icon(Icons.chat_bubble_outline),
                            label: const Text('Support',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (failedApps.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: LinearGradient(
                        colors: [
                          Colors.red.shade50,
                          Colors.orange.shade50,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(
                        color: Colors.red.shade200,
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.red.shade100.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.red.shade100,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.warning_rounded,
                                  color: Colors.red.shade700, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text('Action Needed',
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: Colors.red.shade700)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                            'We found ${failedApps.length} failed interview${failedApps.length > 1 ? 's' : ''}. Don\'t worry—reapply for free or explore similar opportunities.',
                            style: TextStyle(
                                color: Colors.red.shade600,
                                fontSize: 13,
                                height: 1.6)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade600,
                                foregroundColor: Colors.white,
                              ),
                              onPressed: () => Navigator.pushNamed(
                                  context, '/jobMarketplace'),
                              icon: const Icon(Icons.explore, size: 18),
                              label: const Text('Find Similar Jobs'),
                            ),
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(
                                  color: Colors.red.shade300,
                                  width: 1.5,
                                ),
                              ),
                              onPressed: () {
                                if (failedApps.isNotEmpty) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const ApplyScreen(),
                                      settings: RouteSettings(arguments: {
                                        'jobId': failedApps.first.jobId,
                                        'candidateId': _candidateId
                                      }),
                                    ),
                                  );
                                }
                              },
                              icon: const Icon(Icons.refresh, size: 18),
                              label: const Text('Reapply Free'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Access',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.3,
                          ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    SizedBox(
                      width: (MediaQuery.of(context).size.width - 48) / 2,
                      child: _homeStatusCard(
                          'Applications',
                          Icons.assignment_turned_in,
                          Colors.blue,
                          'Track progress'),
                    ),
                    SizedBox(
                      width: (MediaQuery.of(context).size.width - 48) / 2,
                      child: _homeStatusCard('Interviews', Icons.video_call,
                          Colors.teal, 'Join video calls'),
                    ),
                    SizedBox(
                      width: (MediaQuery.of(context).size.width - 48) / 2,
                      child: _homeStatusCard('Job Market',
                          Icons.business_center, Colors.green, 'Browse roles',
                          onTap: () => _tabController.animateTo(2)),
                    ),
                    SizedBox(
                      width: (MediaQuery.of(context).size.width - 48) / 2,
                      child: _homeStatusCard('Messages', Icons.message,
                          Colors.purple, 'Chat with staff'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Statistics',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.3,
                          ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                        child: _homeStatusCard('Local Jobs', Icons.home_work,
                            Colors.indigo, '${localApps.length} applications')),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _homeStatusCard(
                            'Intl Jobs',
                            Icons.flight_takeoff,
                            Colors.deepPurple,
                            '${internationalApps.length} international apps')),
                    const SizedBox(width: 8),
                    Expanded(
                        child: _homeStatusCard('In Review', Icons.hourglass_top,
                            Colors.amber, '$inReview pending')),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.green.shade600, Colors.green.shade400],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.green.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        if (_candidateId != null) {
                          Navigator.pushNamed(context, '/videoCall',
                              arguments: {
                                'channelName': 'staff_${_candidateId!}',
                                'userId': _candidateId!,
                              });
                        }
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            vertical: 14, horizontal: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.call,
                                color: Colors.white,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Voice Call Staff',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.3,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.arrow_forward,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Featured Opportunities',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? Colors.white
                            : Colors.black87,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 200,
                      child: PageView.builder(
                        controller: _bannerController,
                        itemCount: bannerImages.length,
                        onPageChanged: (index) {
                          setState(() => _currentBannerPage = index);
                        },
                        itemBuilder: (context, idx) {
                          final bannerColors = [
                            [Colors.blue.shade700, Colors.blue.shade500],
                            [Colors.purple.shade700, Colors.purple.shade500],
                            [Colors.teal.shade700, Colors.teal.shade500],
                            [Colors.indigo.shade700, Colors.indigo.shade500],
                          ];

                          final bannerIcons = [
                            Icons.work,
                            Icons.trending_up,
                            Icons.language,
                            Icons.star,
                          ];

                          final bannerLabels = [
                            'Local Jobs',
                            'Trending',
                            'International',
                            'Premium',
                          ];

                          return Container(
                            width: double.infinity,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: bannerColors[idx],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: bannerColors[idx][0].withOpacity(0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            margin: const EdgeInsets.symmetric(horizontal: 0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Icon(
                                    bannerIcons[idx],
                                    size: 60,
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  bannerLabels[idx],
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          bannerImages.length,
                          (index) => Container(
                            height: 8,
                            width: 8,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentBannerPage == index
                                  ? Colors.blue.shade600
                                  : Colors.grey.shade300,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.cyan.shade50, Colors.blue.shade50],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.cyan.shade200,
                      width: 1.5,
                    ),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.cyan.shade400.withOpacity(0.2),
                        ),
                        child: Icon(
                          Icons.public,
                          color: Colors.cyan.shade700,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Global Opportunities',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.cyan.shade900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Apply to jobs worldwide, manage documents, and track interviews in one place.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.cyan.shade700,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }

  Widget _homeStatusCard(String title, IconData icon, Color color, String desc,
      {VoidCallback? onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        splashColor: color.withOpacity(0.1),
        child: Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 2,
          shadowColor: color.withOpacity(0.3),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: [
                  color.withOpacity(0.05),
                  color.withOpacity(0.02),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: color.withOpacity(0.15),
                width: 1,
              ),
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(height: 12),
                Text(title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      letterSpacing: 0.3,
                    )),
                const SizedBox(height: 6),
                Text(desc,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey[400]
                          : Colors.grey.shade600,
                      height: 1.4,
                    )),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.bottomRight,
                  child: Icon(
                    Icons.arrow_forward,
                    color: color.withOpacity(0.6),
                    size: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------------- AUTH UI ----------------
  Widget _buildAuthArea() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 24),
            const Text('Candidate Login',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: loginIdCtrl,
              decoration: InputDecoration(
                labelText: 'Candidate ID',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : Colors.black87,
                  fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: loginPassCtrl,
              decoration: InputDecoration(
                labelText: 'Password',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : Colors.black87,
                  fontSize: 16),
              obscureText: true,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => _handleLogin(
                  loginIdCtrl.text.trim(), loginPassCtrl.text.trim()),
              child: const Text('Login'),
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 12),
            const Text('Register (KES 1,300)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: regNameCtrl,
              decoration: InputDecoration(
                labelText: 'Full Name',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : Colors.black87,
                  fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: regPhoneCtrl,
              decoration: InputDecoration(
                labelText: 'Phone',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : Colors.black87,
                  fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: regNextOfKinCtrl,
              decoration: InputDecoration(
                labelText: 'Next of Kin',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : Colors.black87,
                  fontSize: 16),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => _showPaymentDialog(
                regNameCtrl.text.trim(),
                regPhoneCtrl.text.trim(),
                regNextOfKinCtrl.text.trim(),
              ),
              child: const Text('Register & Pay KES 1,300'),
            ),
            const SizedBox(height: 20),
            const Text(
                'Note: After registration you will receive a Candidate ID and temporary password. Use them to login.'),
          ],
        ),
      ),
    );
  }

  Future<void> _showPaymentDialog(
      String name, String phone, String nextOfKin) async {
    if (name.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Enter name and phone')));
      return;
    }
    // present method choices
    final TextEditingController msgCtrl = TextEditingController();
    String method = 'mpesa';

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        bool processing = false;
        String? error;
        final TextEditingController emailCtrl = TextEditingController();
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            title: const Text('Choose Payment Method'),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RadioListTile<String>(
                    value: 'mpesa',
                    groupValue: method,
                    title: const Text('MPESA (Paybill 600100)'),
                    subtitle:
                        const Text('Pay KES 1,300 then paste MPESA SMS below'),
                    onChanged: (v) => setState(() => method = v ?? 'mpesa'),
                  ),
                  RadioListTile<String>(
                    value: 'flutterwave',
                    groupValue: method,
                    title: const Text('Flutterwave / Card'),
                    subtitle: const Text(
                        'Pay with card or MPESA via Flutterwave gateway'),
                    onChanged: (v) =>
                        setState(() => method = v ?? 'flutterwave'),
                  ),
                  RadioListTile<String>(
                    value: 'paypal',
                    groupValue: method,
                    title: const Text('PayPal / Card'),
                    subtitle: const Text(
                        'Pay via PayPal and paste confirmation below'),
                    onChanged: (v) => setState(() => method = v ?? 'paypal'),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                      'On-time payment required: Your registration is activated only after payment is verified.'),
                  const SizedBox(height: 8),
                  if (method == 'mpesa') ...[
                    const Text('Paybill: 600100',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const Text('Account No: 0100011879308',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: msgCtrl,
                      maxLines: 6,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: 'Paste MPESA confirmation message here'),
                    ),
                  ] else if (method == 'flutterwave') ...[
                    const Text(
                        'You will be redirected to a secure Flutterwave payment flow.'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: emailCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Email (required for card payments)',
                          border: OutlineInputBorder()),
                    ),
                  ] else if (method == 'paypal') ...[
                    const Text('Pay to PayPal: payments@blissconnect.com'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: msgCtrl,
                      maxLines: 6,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: 'Paste PayPal confirmation message here'),
                    ),
                  ],
                  if (error != null) ...[
                    const SizedBox(height: 8),
                    Text(error!, style: const TextStyle(color: Colors.red)),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel')),
              ElevatedButton(
                onPressed: processing
                    ? null
                    : () async {
                        setState(() {
                          processing = true;
                          error = null;
                        });

                        if (method == 'mpesa') {
                          final msg = msgCtrl.text.trim();
                          if (msg.isEmpty) {
                            setState(() {
                              processing = false;
                              error =
                                  'Paste the MPESA confirmation message to verify payment.';
                            });
                            return;
                          }

                          final containsPaybill = msg.contains('600100') ||
                              msg.toLowerCase().contains('paybill');
                          final containsAccount =
                              msg.contains('0100011879308') ||
                                  msg.toLowerCase().contains('account');
                          final containsAmount = RegExp(
                                  r"\b1300\b|KES\s*1[, ]?300|Ksh\s*1[, ]?300",
                                  caseSensitive: false)
                              .hasMatch(msg);
                          if (!(containsPaybill || containsAccount) ||
                              !containsAmount) {
                            setState(() {
                              processing = false;
                              error =
                                  'Could not verify payment details in the message. Ensure it contains the paybill/account and amount KES 1,300.';
                            });
                            return;
                          }

                          String? txId;
                          final txRegex = RegExp(r"\b[A-Z0-9]{6,}\b");
                          final matches = txRegex
                              .allMatches(msg.toUpperCase())
                              .map((m) => m.group(0))
                              .toList();
                          if (matches.isNotEmpty) {
                            txId = matches.firstWhere(
                                (m) =>
                                    m != null &&
                                    !RegExp(r'^(07|254)\d+').hasMatch(m),
                                orElse: () => matches.first);
                          }

                          final rand = Random();
                          final id = 'C${100000 + rand.nextInt(899999)}';
                          final tempPass =
                              (100000 + rand.nextInt(899999)).toString();

                          final regResponse = await http.post(
                            Uri.parse(
                                'https://your-backend-url/api/candidate/register'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'candidateId': id,
                              'password': tempPass,
                              'name': name,
                              'phone': phone,
                              'nextOfKin': nextOfKin,
                              'registrationPaid': true,
                              'paymentMethod': 'mpesa',
                              'mpesaConfirmationMessage': msg,
                              'mpesaTransactionId': txId,
                            }),
                          );
                          if (regResponse.statusCode != 200) {
                            setState(() {
                              processing = false;
                              error = 'Registration failed. Please try again.';
                            });
                            return;
                          }

                          await _saveCandidateSession(id);

                          showDialog(
                              context: context,
                              builder: (_) => AlertDialog(
                                    title: const Text('Registered'),
                                    content: Text(
                                        'Candidate ID: $id\nTemporary Password: $tempPass'),
                                    actions: [
                                      TextButton(
                                          onPressed: () =>
                                              Navigator.of(context).pop(),
                                          child: const Text('OK'))
                                    ],
                                  ));

                          Navigator.of(context).pop();
                          return;
                        }

                        if (method == 'paypal') {
                          final msg = msgCtrl.text.trim();
                          if (msg.isEmpty) {
                            setState(() {
                              processing = false;
                              error =
                                  'Paste the PayPal confirmation message to verify payment.';
                            });
                            return;
                          }

                          final containsPaypal =
                              msg.toLowerCase().contains('paypal');
                          final containsAmount = RegExp(
                                  r"\b1300\b|KES\s*1[, ]?300|Ksh\s*1[, ]?300|1,300",
                                  caseSensitive: false)
                              .hasMatch(msg);
                          if (!containsPaypal || !containsAmount) {
                            setState(() {
                              processing = false;
                              error =
                                  'Could not verify PayPal message. Ensure it mentions PayPal and amount KES 1,300.';
                            });
                            return;
                          }

                          String? txId;
                          final txRegex = RegExp(r"[A-Z0-9]{6,}");
                          final matches = txRegex
                              .allMatches(msg.toUpperCase())
                              .map((m) => m.group(0))
                              .toList();
                          if (matches.isNotEmpty) txId = matches.first;

                          final rand = Random();
                          final id = 'C${100000 + rand.nextInt(899999)}';
                          final tempPass =
                              (100000 + rand.nextInt(899999)).toString();

                          final regResponse = await http.post(
                            Uri.parse(
                                'https://your-backend-url/api/candidate/register'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'candidateId': id,
                              'password': tempPass,
                              'name': name,
                              'phone': phone,
                              'nextOfKin': nextOfKin,
                              'registrationPaid': true,
                              'paymentMethod': 'paypal',
                              'paypalConfirmationMessage': msg,
                              'paypalTransactionId': txId,
                            }),
                          );
                          if (regResponse.statusCode != 200) {
                            setState(() {
                              processing = false;
                              error = 'Registration failed. Please try again.';
                            });
                            return;
                          }

                          await _saveCandidateSession(id);

                          showDialog(
                              context: context,
                              builder: (_) => AlertDialog(
                                    title: const Text('Registered'),
                                    content: Text(
                                        'Candidate ID: $id\nTemporary Password: $tempPass'),
                                    actions: [
                                      TextButton(
                                          onPressed: () =>
                                              Navigator.of(context).pop(),
                                          child: const Text('OK'))
                                    ],
                                  ));

                          Navigator.of(context).pop();
                          return;
                        }

                        if (method == 'flutterwave') {
                          final email = emailCtrl.text.trim();
                          if (email.isEmpty) {
                            setState(() {
                              processing = false;
                              error = 'Email is required for card payments.';
                            });
                            return;
                          }

                          // create candidate skeleton before payment so PaymentService has a candidateId
                          final rand = Random();
                          final id = 'C${100000 + rand.nextInt(899999)}';
                          final tempPass =
                              (100000 + rand.nextInt(899999)).toString();

                          final regResponse = await http.post(
                            Uri.parse(
                                'https://your-backend-url/api/candidate/register'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'candidateId': id,
                              'password': tempPass,
                              'name': name,
                              'phone': phone,
                              'nextOfKin': nextOfKin,
                              'email': email,
                              'registrationPaid': false,
                            }),
                          );
                          if (regResponse.statusCode != 200) {
                            setState(() {
                              processing = false;
                              error = 'Registration failed. Please try again.';
                            });
                            return;
                          }

                          // build Candidate object for PaymentsScreen
                          final candidate = Candidate(
                            id: id,
                            fullName: name,
                            age: 25,
                            gender: 'Not specified',
                            country: '',
                            expectedSalary: 0,
                            hireCost: 0,
                            skills: [],
                            experienceYears: 0,
                            photoUrl: '',
                            passportStatus: '',
                            visaOption: '',
                            currency: 'KES',
                            phone: phone,
                            email: email,
                          );

                          Navigator.of(context).pop();

                          // navigate to PaymentsScreen and wait for completion
                          final res = await Navigator.push<bool?>(
                            context,
                            MaterialPageRoute(
                                builder: (_) => PaymentsScreen(
                                      candidate: candidate,
                                      employerId: 'SELF_REGISTRATION',
                                      employerName: 'bliss connect',
                                      visaOption: 'registration',
                                      amount: 1300.0,
                                      title: 'Registration Fee KES 1,300',
                                    )),
                          );

                          if (res == true) {
                            // check payments collection for verified payment

                            final paymentResponse = await http.post(
                              Uri.parse(
                                  'https://your-backend-url/api/payment/verify'),
                              headers: {'Content-Type': 'application/json'},
                              body: jsonEncode({
                                'candidateId': id,
                                'method': 'flutterwave',
                              }),
                            );
                            if (paymentResponse.statusCode != 200) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('Payment not completed.')));
                              return;
                            }

                            await _saveCandidateSession(id);

                            showDialog(
                                context: context,
                                builder: (_) => AlertDialog(
                                      title: const Text('Registered'),
                                      content: Text(
                                          'Candidate ID: $id\nTemporary Password: $tempPass'),
                                      actions: [
                                        TextButton(
                                            onPressed: () =>
                                                Navigator.of(context).pop(),
                                            child: const Text('OK'))
                                      ],
                                    ));
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Payment not completed.')));
                          }

                          return;
                        }

                        setState(() {
                          processing = false;
                          error = 'Unknown payment method';
                        });
                      },
                child: processing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator())
                    : const Text('Proceed'),
              ),
            ],
          );
        });
      },
    );
  }

  String _getChatId(String candidateId, String otherId) {
    final ids = [candidateId, otherId]..sort();
    return ids.join('_');
  }

  Future<void> _handleLogin(String id, String password) async {
    if (id.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Enter ID and password')));
      return;
    }

    // Check if it's boss credentials first
    if (id == 'boss' && password == 'boss123') {
      await _saveCandidateSession('boss');
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Boss logged in')));
      return;
    }

    final response = await http.post(
      Uri.parse('https://your-backend-url/api/candidate/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'candidateId': id, 'password': password}),
    );
    if (response.statusCode != 200) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid ID or password')));
      return;
    }
    await _saveCandidateSession(id);
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Logged in')));
  }

  Widget _buildApplicationsTab(
      BuildContext context, ApplicantsService service, String candidateId) {
    return StreamBuilder<List<ApplicationModel>>(
      stream: service.getApplicationsByCandidate(candidateId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final apps = snapshot.data ?? [];

        if (apps.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.inbox, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text('No applications yet.',
                    style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: apps.length,
          itemBuilder: (context, idx) {
            final a = apps[idx];
            final dateStr =
                DateFormat.yMMMd().add_jm().format(a.applicationDate);

            Color statusColor;
            final status = a.applicationStatus.toLowerCase();
            if (a.isHired || status.contains('hired') || a.hireFeesPaid) {
              statusColor = Colors.green;
            } else if (status.contains('pending')) {
              statusColor = Colors.amber.shade700;
            } else if (status.contains('rejected') ||
                status.contains('failed')) {
              statusColor = Colors.red.shade700;
            } else {
              statusColor = Colors.blue.shade700;
            }

            return Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 2,
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: Theme.of(context)
                          .colorScheme
                          .primary
                          .withOpacity(0.12),
                      child: Text(
                        a.jobTitle.isNotEmpty
                            ? a.jobTitle[0].toUpperCase()
                            : 'J',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(a.jobTitle,
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600)),
                              ),
                              Chip(
                                backgroundColor: statusColor.withOpacity(0.12),
                                label: Text(a.applicationStatus,
                                    style: TextStyle(
                                        color: statusColor,
                                        fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(a.employerName,
                              style: TextStyle(color: Colors.grey[700])),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: status.contains('selected') ||
                                          status.contains('hired')
                                      ? Colors.green.withOpacity(0.12)
                                      : Colors.grey.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  status.contains('selected') ||
                                          status.contains('hired')
                                      ? 'Selected by Employer'
                                      : 'Not selected yet',
                                  style: TextStyle(
                                    color: status.contains('selected') ||
                                            status.contains('hired')
                                        ? Colors.green.shade700
                                        : Colors.grey.shade700,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              if (a.interviewScheduled &&
                                  a.interviewDate != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Interview: ${DateFormat.yMMMd().format(a.interviewDate!)}',
                                    style: TextStyle(
                                        color: Colors.blue.shade700,
                                        fontSize: 11),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.calendar_today,
                                  size: 14, color: Colors.grey[600]),
                              const SizedBox(width: 6),
                              Text(dateStr,
                                  style: TextStyle(
                                      color: Colors.grey[600], fontSize: 12)),
                              const Spacer(),
                              if (a.applicationStatus
                                      .toLowerCase()
                                      .contains('failed') ||
                                  a.applicationStatus
                                      .toLowerCase()
                                      .contains('rejected'))
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text('Interview failed',
                                      style: TextStyle(
                                          color: Colors.red.shade700,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold)),
                                ),
                              IconButton(
                                icon: const Icon(Icons.remove_red_eye_outlined),
                                tooltip: 'View details',
                                onPressed: () {
                                  // TODO: navigate to application details
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          if (a.applicationStatus
                                  .toLowerCase()
                                  .contains('failed') ||
                              a.applicationStatus
                                  .toLowerCase()
                                  .contains('rejected'))
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Divider(),
                                Text(
                                    'Interview failed. You can reapply for free or view other jobs.',
                                    style: TextStyle(
                                        color: Colors.red.shade700,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12)),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () {
                                          Navigator.pushNamed(
                                              context, '/jobMarketplace');
                                        },
                                        child: const Text('View jobs'),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () {
                                          // reapply flow: open apply screen with same job
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  const ApplyScreen(),
                                              settings: RouteSettings(
                                                arguments: {
                                                  'jobId': a.jobId,
                                                  'candidateId': _candidateId,
                                                },
                                              ),
                                            ),
                                          );
                                        },
                                        child: const Text('Reapply free'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildJobsMarketplaceTab(BuildContext context, JobService jobService) {
    return FutureBuilder<List<Job>>(
      future: jobService.fetchJobs(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final jobs = snapshot.data!;
        final filteredJobs = _jobFilter == 'All'
            ? jobs
            : jobs.where((j) => j.localOrInternational == _jobFilter).toList();
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  const Text('Show:'),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('All'),
                    selected: _jobFilter == 'All',
                    onSelected: (_) => setState(() => _jobFilter = 'All'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Local'),
                    selected: _jobFilter == 'Local',
                    onSelected: (_) => setState(() => _jobFilter = 'Local'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('International'),
                    selected: _jobFilter == 'International',
                    onSelected: (_) =>
                        setState(() => _jobFilter = 'International'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: filteredJobs.isEmpty
                  ? const Center(child: Text('No jobs match this filter.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: filteredJobs.length,
                      itemBuilder: (context, idx) {
                        final job = filteredJobs[idx];
                        return Card(
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        job.jobTitle,
                                        style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    if (job.featured)
                                      Chip(
                                        label: const Text('Featured',
                                            style: TextStyle(fontSize: 10)),
                                        backgroundColor:
                                            Colors.amber.withOpacity(0.12),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '${job.companyName} • ${job.location}, ${job.country}',
                                  style: TextStyle(color: Colors.grey[700]),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Chip(
                                      label: Text(job.localOrInternational,
                                          style: const TextStyle(fontSize: 11)),
                                      backgroundColor:
                                          job.localOrInternational == 'Local'
                                              ? Colors.green.shade50
                                              : Colors.orange.shade50,
                                    ),
                                    const SizedBox(width: 8),
                                    Chip(
                                      label: Text(
                                          "Deployment fee: USD ${job.localOrInternational == 'Local' ? '600' : '1000'}",
                                          style: const TextStyle(fontSize: 11)),
                                      backgroundColor: Colors.blue.shade50,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${job.salary} ${job.currency}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14),
                                    ),
                                    Text(
                                      '${job.vacancies} vacancies',
                                      style: TextStyle(
                                        backgroundColor:
                                            Colors.blue.withOpacity(0.12),
                                        color: Colors.blue[700],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              const ApplyScreen(),
                                          settings: RouteSettings(
                                            arguments: {
                                              'job': job,
                                              'candidateId': _candidateId,
                                            },
                                          ),
                                        ),
                                      );
                                    },
                                    child: const Text('Apply Now'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTravelDocsTab(BuildContext context) {
    final travelDocs = [
      {
        'icon': Icons.assignment,
        'label': 'Medical Certificate',
        'description': 'GAMCA, Normal Medical'
      },
      {
        'icon': Icons.description,
        'label': 'Passport',
        'description': 'Apply or renew passport'
      },
      {
        'icon': Icons.card_travel,
        'label': 'Work Permit',
        'description': 'Get work authorization'
      },
      {
        'icon': Icons.mail,
        'label': 'Invitation Letter',
        'description': 'Request invitation letter'
      },
    ];

    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: travelDocs.length,
      itemBuilder: (context, idx) {
        final doc = travelDocs[idx];
        return Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 1,
          child: InkWell(
            onTap: () {
              // TODO: Navigate to specific travel document screen
              Navigator.pushNamed(context, '/travel_docs');
            },
            child: Padding(
              padding: const EdgeInsets.all(10.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon((doc['icon'] as IconData),
                      size: 28, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 10),
                  Text(
                    doc['label'] as String,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    doc['description'] as String,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Documents management
  Widget _buildDocumentsTab(BuildContext context) {
    if (_candidateId == null) return const Center(child: Text('Not logged in'));

    return FutureBuilder<http.Response>(
      future: http.get(Uri.parse(
          'https://your-backend-url/api/candidate/documents?candidateId=$_candidateId')),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.data!.statusCode != 200) {
          return const Center(child: Text('Failed to load documents.'));
        }
        final List docs = jsonDecode(snapshot.data!.body);
        return Column(
          children: [
            Expanded(
              child: docs.isEmpty
                  ? const Center(child: Text('No documents uploaded'))
                  : ListView.builder(
                      itemCount: docs.length,
                      itemBuilder: (context, idx) {
                        final data = docs[idx];
                        return ListTile(
                          title: Text(data['filename'] ?? 'Document'),
                          subtitle:
                              Text('Status: ${data['status'] ?? 'pending'}'),
                          trailing: IconButton(
                            icon: const Icon(Icons.download),
                            onPressed: () async {
                              final url = data['downloadUrl'] as String?;
                              if (url != null) {
                                debugPrint('Download: $url');
                              }
                            },
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Upload Document'),
                      onPressed: () async {
                        final result = await FilePicker.platform.pickFiles();
                        if (result == null || result.files.isEmpty) return;
                        final fileBytes = result.files.first.bytes;
                        final fileName = result.files.first.name;
                        if (fileBytes == null) return;

                        // Upload to backend
                        final request = http.MultipartRequest(
                          'POST',
                          Uri.parse(
                              'https://your-backend-url/api/candidate/uploadDocument'),
                        );
                        request.fields['candidateId'] = _candidateId ?? '';
                        request.files.add(http.MultipartFile.fromBytes(
                            'file', fileBytes,
                            filename: fileName));
                        final response = await request.send();
                        if (response.statusCode == 200) {
                          ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Uploaded')));
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Upload failed')));
                        }
                      },
                    ),
                  ),
                ],
              ),
            )
          ],
        );
      },
    );
  }

  Widget _buildInterviewsTab(
      BuildContext context, ApplicantsService service, String candidateId) {
    return StreamBuilder<List<ApplicationModel>>(
      stream: service.getApplicationsByCandidate(candidateId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final apps = snapshot.data ?? [];
        final interviews = apps
            .where((a) => a.interviewScheduled && a.interviewDate != null)
            .toList();

        if (interviews.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.video_call, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text('No interviews scheduled yet.',
                    style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: interviews.length,
          itemBuilder: (context, idx) {
            final interview = interviews[idx];
            final dateStr =
                DateFormat.yMMMd().add_jm().format(interview.interviewDate!);

            Color statusColor;
            if (interview.interviewStatus.toLowerCase().contains('passed')) {
              statusColor = Colors.green;
            } else if (interview.interviewStatus
                .toLowerCase()
                .contains('failed')) {
              statusColor = Colors.red.shade700;
            } else {
              statusColor = Colors.blue.shade700;
            }

            return Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 2,
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.video_call, color: Colors.blue.shade700),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Interview: ${interview.jobTitle}',
                                style: const TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                interview.employerName,
                                style: TextStyle(
                                    color: Colors.grey[700], fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Chip(
                          backgroundColor: statusColor.withOpacity(0.12),
                          label: Text(interview.interviewStatus,
                              style: TextStyle(
                                  color: statusColor,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.calendar_today,
                            size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 6),
                        Text(dateStr,
                            style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.message),
                        label: const Text('Contact Interviewer'),
                        onPressed: () {
                          // TODO: Open chat with interviewer
                          Navigator.pushNamed(context, '/blissHome');
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildMessagingTab(BuildContext context) {
    if (_candidateId == null) return const Center(child: Text('Not logged in'));

    // Get applications to find employers the candidate has applied to
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _getEmployersForMessaging(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final employers = snapshot.data ?? [];
        if (employers.isEmpty) {
          return const Center(
            child: Text(
                'No conversations yet. Apply for jobs to start chatting with employers.'),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: employers.length,
          itemBuilder: (context, index) {
            final employer = employers[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.blue.shade100,
                  child: Text(
                    employer['companyName']?.substring(0, 1).toUpperCase() ??
                        'E',
                    style: const TextStyle(color: Colors.blue),
                  ),
                ),
                title: Text(employer['companyName'] ?? 'Employer'),
                subtitle: Text('Tap to start conversation'),
                trailing: const Icon(Icons.chat, color: Colors.blue),
                onTap: () {
                  if (_candidateId == null) return;
                  final chatId = _getChatId(
                      _candidateId!, employer['employerId'] ?? 'unknown');
                  Navigator.pushNamed(
                    context,
                    '/privateChatDetails',
                    arguments: {
                      'chatId': chatId,
                      'otherUserId': employer['employerId'] ?? 'unknown',
                      'otherUserName': employer['companyName'] ?? 'Employer',
                      'otherUserAvatar': employer['logoUrl'] ?? '',
                    },
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildProfileSettingsTab(BuildContext context) {
    final nameController =
        TextEditingController(text: _candidateProfile?['name'] ?? '');
    final emailController =
        TextEditingController(text: _candidateProfile?['email'] ?? '');
    final phoneController =
        TextEditingController(text: _candidateProfile?['phone'] ?? '');
    final countryController =
        TextEditingController(text: _candidateProfile?['country'] ?? 'Kenya');

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Profile Settings',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            if (_candidateProfile?['photoUrl'] != null &&
                _candidateProfile!['photoUrl'].isNotEmpty)
              CircleAvatar(
                  radius: 40,
                  backgroundImage: NetworkImage(_candidateProfile!['photoUrl']))
            else
              const CircleAvatar(
                  radius: 40, child: Icon(Icons.person, size: 40)),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              icon: const Icon(Icons.photo_camera),
              label: const Text('Upload Photo'),
              onPressed: _uploadProfilePhoto,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.brightness_6),
                const SizedBox(width: 8),
                const Expanded(child: Text('Theme')),
                Switch(
                  value: Provider.of<ThemeNotifier>(context).isDarkMode,
                  onChanged: (value) {
                    Provider.of<ThemeNotifier>(context, listen: false)
                        .setDarkMode(value);
                  },
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.call),
                    label: const Text('Call Staff'),
                    onPressed: () {
                      if (_candidateId != null) {
                        Navigator.pushNamed(context, '/videoCall', arguments: {
                          'channelName': 'staff_${_candidateId!}',
                          'userId': _candidateId!,
                        });
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.call),
                    label: const Text('Call Employer'),
                    onPressed: () {
                      if (_candidateId != null) {
                        Navigator.pushNamed(context, '/videoCall', arguments: {
                          'channelName': 'employer_${_candidateId!}',
                          'userId': _candidateId!,
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 8),
            TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 8),
            TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 8),
            TextField(
                controller: countryController,
                decoration: const InputDecoration(labelText: 'Country')),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                if (_candidateId == null) return;
                final response = await http.post(
                  Uri.parse(
                      'https://your-backend-url/api/candidate/updateProfile'),
                  headers: {'Content-Type': 'application/json'},
                  body: jsonEncode({
                    'candidateId': _candidateId,
                    'name': nameController.text.trim(),
                    'email': emailController.text.trim(),
                    'phone': phoneController.text.trim(),
                    'country': countryController.text.trim(),
                  }),
                );
                if (response.statusCode == 200) {
                  await _loadCandidateProfile(_candidateId!);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Profile updated')));
                  }
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Update failed')));
                  }
                }
              },
              child: const Text('Save Profile'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('candidateId');
                if (mounted) {
                  setState(() {
                    _candidateId = null;
                    _candidateProfile = null;
                  });
                }
              },
              child: const Text('Logout'),
            ),
          ],
        ),
      ),
    );
  }

  Future<List<Map<String, dynamic>>> _getEmployersForMessaging() async {
    try {
      final response = await http.get(Uri.parse(
          'https://your-backend-url/api/candidate/employers?candidateId=$_candidateId'));
      if (response.statusCode != 200) return [];
      final List employers = jsonDecode(response.body);
      return employers.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  Future<void> _uploadProfilePhoto() async {
    if (_candidateId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Not logged in')),
      );
      return;
    }

    try {
      // Pick image from device
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (image == null) {
        // User cancelled
        return;
      }

      // Show loading dialog
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) => Dialog(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                const Text(
                  'Uploading photo...',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
      );

      // Upload to backend
      final imageBytes = await image.readAsBytes();
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('https://your-backend-url/api/candidate/uploadPhoto'),
      );
      request.fields['candidateId'] = _candidateId ?? '';
      request.files.add(http.MultipartFile.fromBytes('file', imageBytes,
          filename: image.name));
      final response = await request.send();
      if (response.statusCode == 200) {
        await _loadCandidateProfile(_candidateId!);
      } else {
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('❌ Upload failed'),
              backgroundColor: Colors.red.shade600,
              duration: const Duration(seconds: 4),
            ),
          );
        }
        return;
      }

      // Close loading dialog
      if (mounted) {
        Navigator.of(context).pop();
      }

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('✓ Profile photo updated successfully!'),
            backgroundColor: Colors.green.shade600,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      // Close loading dialog
      if (mounted) {
        Navigator.of(context).pop();
      }

      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Upload failed: ${e.toString()}'),
            backgroundColor: Colors.red.shade600,
            duration: const Duration(seconds: 4),
          ),
        );
      }

      debugPrint('Photo upload error: $e');
    }
  }
}
