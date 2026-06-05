// styled_employer_dashboard.dart
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:bliss_mobile/firebase_stub.dart';

// your existing screens (aliased where you previously aliased them)
import 'employer_post_job_screen.dart' as post_job_screen;
import 'generate_offer_letter_screen.dart' as offer_letter_screen;
import 'employer_candidates_screen.dart' as candidates_screen;
import 'employer_applicants_screen.dart' as applicants_screen;
import 'employer_settings_screen.dart' as settings_screen;
import 'company_profile_edit_screen.dart' as profile_screen;
import 'employer_communication_screen.dart';
import 'schedule_interview_screen.dart';

import 'applicants_list_screen.dart';
import 'review_job_screen.dart';
import 'generate_work_contract_screen.dart';

// Candidate model

/// Modern, polished Employer Dashboard UI (SaaS style).
/// Ready to populate with real jobs from Firestore or your backend.
class StyledEmployerDashboard extends StatefulWidget {
  final String employerId;
  final String employerName;
  final String companyName;

  const StyledEmployerDashboard({
    super.key,
    required this.employerId,
    required this.employerName,
    required this.companyName,
  });

  @override
  State<StyledEmployerDashboard> createState() =>
      _StyledEmployerDashboardState();
}

class _StyledEmployerDashboardState extends State<StyledEmployerDashboard> {
  // accent color for the dashboard
  final Color accent = const Color(0xFF6C4BFF);

  // Page controller for slides
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _timer;

  // jobs list starts empty; populate from Firestore
  final List<Map<String, String>> jobs = [];

  String? selectedJobId;
  String? selectedJobTitle;

  @override
  void initState() {
    super.initState();
    _startAutoScroll();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _timer = Timer.periodic(const Duration(seconds: 3), (Timer timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      int nextPage = _currentPage + 1;
      if (nextPage >= 7) {
        nextPage = 0;
      }

      _pageController
          .animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      )
          .then((_) {
        if (mounted) {
          setState(() {
            _currentPage = nextPage;
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool isWide = MediaQuery.of(context).size.width > 980;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0B0E),
      body: SafeArea(
        child: Row(
          children: [
            // Sidebar
            Container(
              width: isWide ? 280 : 80,
              padding: EdgeInsets.symmetric(
                vertical: 22,
                horizontal: isWide ? 20 : 8,
              ),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0B0B0E), Color(0xFF0F0E12)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                border: Border(
                  right: BorderSide(color: Colors.white.withOpacity(0.03)),
                ),
              ),
              child: Column(
                crossAxisAlignment: isWide
                    ? CrossAxisAlignment.start
                    : CrossAxisAlignment.center,
                children: [
                  if (isWide) ...[
                    Text(
                      'Employer Portal',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: accent.withOpacity(0.15),
                          child: Icon(Icons.person, color: accent, size: 28),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(widget.employerName,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Text(widget.companyName,
                                  style: TextStyle(
                                      color: Colors.white70, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                  ] else ...[
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: accent.withOpacity(0.15),
                      child: Icon(Icons.person, color: accent, size: 18),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // nav items
                  _sidebarItem(
                    icon: Icons.dashboard,
                    label: 'Dashboard',
                    isWide: isWide,
                    active: true,
                    onTap: () {},
                  ),
                  const SizedBox(height: 6),

                  _sidebarItem(
                    icon: Icons.add_box_outlined,
                    label: 'Post Job',
                    isWide: isWide,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => post_job_screen.EmployerPostJobScreen(
                            employerId: widget.employerId,
                            employerName: widget.employerName,
                            companyName: widget.companyName,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 6),

                  _sidebarItem(
                    icon: Icons.person_search_outlined,
                    label: 'Candidates',
                    isWide: isWide,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              candidates_screen.EmployerCandidatesScreen(
                            employerId: widget.employerId,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 6),

                  _sidebarItem(
                    icon: Icons.storefront_outlined,
                    label: 'Applied Candidates',
                    isWide: isWide,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              applicants_screen.EmployerApplicantsScreen(
                            employerId: widget.employerId,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 6),

                  _sidebarItem(
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    isWide: isWide,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const settings_screen.EmployerSettingsScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 6),

                  _sidebarItem(
                    icon: Icons.account_box_outlined,
                    label: 'Company Profile',
                    isWide: isWide,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const profile_screen.CompanyProfileEditScreen(),
                        ),
                      );
                    },
                  ),
                  const Spacer(),

                  if (isWide)
                    Text('© ${DateTime.now().year} bliss connect',
                        style: TextStyle(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),

            // Main content
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(
                    vertical: 24, horizontal: isWide ? 28 : 16),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // header row
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _welcomeHeader()),
                          if (isWide)
                            Row(
                              children: [
                                _miniIconButton(Icons.search, onTap: () {
                                  // TODO: Implement search
                                }),
                                const SizedBox(width: 8),
                                _miniIconButton(Icons.message, onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          EmployerCommunicationScreen(
                                        employerId: widget.employerId,
                                        employerName: widget.employerName,
                                      ),
                                    ),
                                  );
                                }),
                                const SizedBox(width: 8),
                                _miniIconButton(Icons.notifications_none,
                                    onTap: () {
                                  // TODO: Implement notifications
                                }),
                                const SizedBox(width: 8),
                                _profileAvatarSmall(accent),
                              ],
                            ),
                        ],
                      ),

                      const SizedBox(height: 18),
                      StreamBuilder<QuerySnapshot>(
                        stream: FirebaseFirestore.instance
                            .collection('candidates')
                            .where('employerId', isEqualTo: widget.employerId)
                            .snapshots(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) {
                            return const Center(
                                child: CircularProgressIndicator(
                                    color: Colors.white));
                          }
                          final docs = snapshot.data!.docs;
                          final total = docs.length;
                          final applied =
                              docs.where((d) => d['hasApplied'] == true).length;
                          final interview = docs
                              .where((d) => d['interviewScheduled'] == true)
                              .length;
                          final hired =
                              docs.where((d) => d['isHired'] == true).length;
                          final unpaid = docs
                              .where((d) =>
                                  d['isHired'] == true && d['hirePaid'] != true)
                              .length;
                          final unlocked = docs
                              .where((d) => d['documentsUnlocked'] == true)
                              .length;
                          return Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: _pipelineCard(
                                        'Total Applicants', total, Colors.blue),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _pipelineCard(
                                        'Applied', applied, Colors.purple),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: _pipelineCard(
                                        'Interview', interview, Colors.orange),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _pipelineCard(
                                        'Hired', hired, Colors.green),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: _pipelineCard(
                                        'Hire Due', unpaid, Colors.red),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _pipelineCard(
                                        'Docs Unlocked', unlocked, Colors.teal),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          Expanded(
                            child: Card(
                              color: Colors.white.withOpacity(0.05),
                              child: ListTile(
                                leading: const Icon(Icons.handshake,
                                    color: Colors.white),
                                title: const Text('Hire Agent',
                                    style: TextStyle(color: Colors.white)),
                                subtitle: const Text(
                                    'Get a dedicated recruiter',
                                    style: TextStyle(color: Colors.white70)),
                                trailing: TextButton(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                          content:
                                              Text('Hire agent request sent.')),
                                    );
                                  },
                                  child: const Text('Hire',
                                      style: TextStyle(color: Colors.white)),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Card(
                              color: Colors.white.withOpacity(0.05),
                              child: ListTile(
                                leading: const Icon(Icons.support_agent,
                                    color: Colors.white),
                                title: const Text('Support & Tickets',
                                    style: TextStyle(color: Colors.white)),
                                subtitle: const Text('Open support ticket',
                                    style: TextStyle(color: Colors.white70)),
                                trailing: IconButton(
                                  icon: const Icon(Icons.arrow_forward,
                                      color: Colors.white),
                                  onPressed: () {
                                    Navigator.pushNamed(context, '/support');
                                  },
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Employer Slides Carousel
                      SizedBox(
                        height: 280,
                        child: PageView(
                          controller: _pageController,
                          onPageChanged: (index) {
                            setState(() {
                              _currentPage = index;
                            });
                          },
                          children: [
                            'assets/images/employerslide1.jpeg',
                            'assets/images/employerslide2.jpeg',
                            'assets/images/employerslide3.jpeg',
                            'assets/images/employerslide4.jpeg',
                            'assets/images/employerslide5.jpeg',
                            'assets/images/employerslide6.jpeg',
                            'assets/images/employerslide7.jpeg',
                          ]
                              .map((slide) => Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8.0),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color:
                                                Colors.black.withOpacity(0.3),
                                            blurRadius: 8,
                                          )
                                        ],
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: Image.asset(
                                          slide,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              Container(
                                            color: Colors.grey[700],
                                            child: const Center(
                                              child: Text('Employer Slide',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  )),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),

                      const SizedBox(height: 12),
                      // Page Indicators
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                            7,
                            (index) => Container(
                                  width: 8,
                                  height: 8,
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 4),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _currentPage == index
                                        ? accent
                                        : Colors.white.withOpacity(0.3),
                                  ),
                                )),
                      ),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.02),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: Colors.white.withOpacity(0.03)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Your Jobs',
                                      style: TextStyle(
                                          color: Colors.white70,
                                          fontWeight: FontWeight.w700)),
                                  TextButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => post_job_screen
                                              .EmployerPostJobScreen(
                                            employerId: widget.employerId,
                                            employerName: widget.employerName,
                                            companyName: widget.companyName,
                                          ),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.add,
                                        color: Colors.white70),
                                    label: const Text('Post a job',
                                        style:
                                            TextStyle(color: Colors.white70)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Expanded(
                                child: StreamBuilder<QuerySnapshot>(
                                  stream: FirebaseFirestore.instance
                                      .collection('jobs')
                                      .where('employerId',
                                          isEqualTo: widget.employerId)
                                      .orderBy('createdAt', descending: true)
                                      .snapshots(),
                                  builder: (context, snapshot) {
                                    if (snapshot.connectionState ==
                                        ConnectionState.waiting) {
                                      return const Center(
                                          child: CircularProgressIndicator());
                                    }

                                    if (!snapshot.hasData ||
                                        snapshot.data!.docs.isEmpty) {
                                      return const Center(
                                        child: Text(
                                            'No jobs posted yet. Post your first job!'),
                                      );
                                    }

                                    final docs = snapshot.data!.docs;
                                    return ListView.separated(
                                      itemCount: docs.length,
                                      separatorBuilder: (_, __) =>
                                          const SizedBox(height: 12),
                                      itemBuilder: (context, idx) {
                                        final doc = docs[idx];
                                        final data =
                                            doc.data() as Map<String, dynamic>;
                                        final title =
                                            data['jobTitle'] as String? ??
                                                'Job Opening';
                                        final salary =
                                            data['salary']?.toString() ?? 'N/A';
                                        final isSelected =
                                            selectedJobId == doc.id;

                                        return _jobCard(
                                          jobId: doc.id,
                                          title: title,
                                          salary: '\$$salary',
                                          selected: isSelected,
                                          accent: accent,
                                          onTap: () {
                                            setState(() {
                                              selectedJobId = doc.id;
                                              selectedJobTitle = title;
                                            });
                                          },
                                          onViewApplicants: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    ApplicantsListScreen(
                                                  jobId: doc.id,
                                                  jobTitle: title,
                                                ),
                                              ),
                                            );
                                          },
                                          onScheduleInterview: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    ScheduleInterviewScreen(
                                                  candidateName: 'Candidate',
                                                  candidateId: 'candidate',
                                                ),
                                              ),
                                            );
                                          },
                                          onReviewJob: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => ReviewJobScreen(
                                                  jobTitle: title,
                                                  jobCategory:
                                                      data['jobType'] ??
                                                          'General',
                                                  location: data['location'] ??
                                                      'Unknown',
                                                  salary: '\$$salary',
                                                  description:
                                                      data['jobDescription'] ??
                                                          '',
                                                  requirements:
                                                      data['requirements'] ??
                                                          '',
                                                ),
                                              ),
                                            );
                                          },
                                          onGenerateOffer: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    const offer_letter_screen
                                                        .GenerateOfferLetterScreen(),
                                              ),
                                            );
                                          },
                                          onGenerateContract: () {
                                            if (selectedJobId == null ||
                                                selectedJobTitle == null) {
                                              ScaffoldMessenger.of(context)
                                                  .showSnackBar(
                                                const SnackBar(
                                                    content: Text(
                                                        'Please select a job first')),
                                              );
                                              return;
                                            }
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    GenerateWorkContractScreen(
                                                  employerId: widget.employerId,
                                                  jobId: doc.id,
                                                  jobTitle:
                                                      selectedJobTitle ?? title,
                                                ),
                                              ),
                                            );
                                          },
                                          onPayments: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => applicants_screen
                                                    .EmployerApplicantsScreen(
                                                  employerId: widget.employerId,
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  // ---------- UI pieces ----------

  Widget _welcomeHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Welcome, ${widget.employerName}',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text('Manage your jobs, applicants and contracts',
            style: TextStyle(color: Colors.white70)),
      ],
    );
  }

  Widget _miniIconButton(IconData icon, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.03)),
        ),
        child: Icon(icon, color: Colors.white70, size: 18),
      ),
    );
  }

  Widget _profileAvatarSmall(Color accent) {
    return Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: accent.withOpacity(0.14),
          child: Icon(Icons.person, color: accent, size: 18),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _pipelineCard(String title, int count, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(color: Colors.white70, fontSize: 11)),
          const SizedBox(height: 6),
          Text(count.toString(),
              style: TextStyle(
                  color: color, fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _sidebarItem({
    required IconData icon,
    required String label,
    required bool isWide,
    VoidCallback? onTap,
    bool active = false,
  }) {
    final Widget content = Row(
      mainAxisSize: MainAxisSize.max,
      children: [
        Icon(icon, color: active ? accent : Colors.white70, size: 20),
        if (isWide) ...[
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: active ? Colors.white : Colors.white70,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w500)),
          ),
        ],
      ],
    );

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding:
            EdgeInsets.symmetric(vertical: isWide ? 12 : 10, horizontal: 12),
        decoration: BoxDecoration(
          color: active ? accent.withOpacity(0.16) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: content,
      ),
    );
  }

  Widget _jobCard({
    required String jobId,
    required String title,
    required String salary,
    required bool selected,
    required Color accent,
    required VoidCallback onTap,
    required VoidCallback onViewApplicants,
    required VoidCallback onScheduleInterview,
    required VoidCallback onReviewJob,
    required VoidCallback onGenerateOffer,
    required VoidCallback onGenerateContract,
    required VoidCallback onPayments,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? Colors.white.withOpacity(0.03)
              : Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected
                  ? accent.withOpacity(0.6)
                  : Colors.white.withOpacity(0.02)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 10,
              offset: const Offset(0, 6),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16)),
                ),
                Text(salary, style: const TextStyle(color: Colors.white70)),
                const SizedBox(width: 8),
                Icon(Icons.chevron_right, color: Colors.white24),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 10,
              children: [
                _actionButton(
                    icon: Icons.person,
                    label: 'View Applicants',
                    onTap: onViewApplicants,
                    accent: accent),
                _actionButton(
                    icon: Icons.calendar_today,
                    label: 'Schedule Interview',
                    onTap: onScheduleInterview,
                    accent: accent),
                _actionButton(
                    icon: Icons.article,
                    label: 'Review Job',
                    onTap: onReviewJob,
                    accent: accent,
                    wide: true),
                _actionButton(
                    icon: Icons.picture_as_pdf,
                    label: 'Offer Letter',
                    onTap: onGenerateOffer,
                    accent: accent),
                _actionButton(
                    icon: Icons.assignment,
                    label: 'Work Contract',
                    onTap: onGenerateContract,
                    accent: accent),
                _actionButton(
                    icon: Icons.payment,
                    label: 'Payments',
                    onTap: onPayments,
                    accent: accent),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color accent,
    bool wide = false,
  }) {
    final button = ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: accent,
        padding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 6,
      ),
    );

    if (wide) {
      return SizedBox(width: 420, child: button);
    } else {
      return button;
    }
  }
}
