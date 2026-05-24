import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  late Future<Map<String, dynamic>> _dashboardData;

  @override
  void initState() {
    super.initState();
    _dashboardData = _fetchDashboardData();
  }

  Future<Map<String, dynamic>> _fetchDashboardData() async {
    try {
      // Fetch jobs data
      final jobsSnapshot = await _firestore
          .collection('jobs')
          .where('postedBy', isEqualTo: 'bliss_company')
          .get();

      final totalJobs = jobsSnapshot.docs.length;
      int totalApplicants = 0;
      int totalViews = 0;

      for (var doc in jobsSnapshot.docs) {
        final data = doc.data();
        totalApplicants += (data['applicants'] as List?)?.length ?? 0;
        totalViews += (data['views'] as int?) ?? 0;
      }

      // Fetch WhatsApp messages
      final whatsappSnapshot = await _firestore
          .collection('whatsapp_messages')
          .where('postedBy', isEqualTo: 'bliss_company')
          .get();

      final totalWhatsAppMessages = whatsappSnapshot.docs.length;
      int sentMessages = 0;
      int failedMessages = 0;

      for (var doc in whatsappSnapshot.docs) {
        final data = doc.data();
        if (data['status'] == 'sent') {
          sentMessages++;
        } else if (data['status'] == 'failed') {
          failedMessages++;
        }
      }

      // Fetch job applications
      final applicationsSnapshot =
          await _firestore.collection('job_applications').get();

      final totalApplications = applicationsSnapshot.docs.length;
      int pendingApplications = 0;
      int approvedApplications = 0;
      int rejectedApplications = 0;

      for (var doc in applicationsSnapshot.docs) {
        final data = doc.data();
        final status = data['status'] ?? 'pending';
        if (status == 'pending') {
          pendingApplications++;
        } else if (status == 'approved') {
          approvedApplications++;
        } else if (status == 'rejected') {
          rejectedApplications++;
        }
      }

      // Fetch employers count
      final employersSnapshot = await _firestore.collection('employers').get();
      final totalEmployers = employersSnapshot.docs.length;

      // Fetch agents count
      final agentsSnapshot = await _firestore.collection('agents').get();
      final totalAgents = agentsSnapshot.docs.length;

      // Fetch candidates count
      final candidatesSnapshot = await _firestore.collection('candidates').get();
      final totalCandidates = candidatesSnapshot.docs.length;

      return {
        'totalJobs': totalJobs,
        'totalApplicants': totalApplicants,
        'totalViews': totalViews,
        'totalWhatsAppMessages': totalWhatsAppMessages,
        'sentMessages': sentMessages,
        'failedMessages': failedMessages,
        'totalApplications': totalApplications,
        'pendingApplications': pendingApplications,
        'approvedApplications': approvedApplications,
        'rejectedApplications': rejectedApplications,
        'totalEmployers': totalEmployers,
        'totalAgents': totalAgents,
        'totalCandidates': totalCandidates,
      };
    } catch (e) {
      debugPrint('Error fetching dashboard data: $e');
      return {
        'totalJobs': 0,
        'totalApplicants': 0,
        'totalViews': 0,
        'totalWhatsAppMessages': 0,
        'sentMessages': 0,
        'failedMessages': 0,
        'totalApplications': 0,
        'pendingApplications': 0,
        'approvedApplications': 0,
        'rejectedApplications': 0,
        'totalEmployers': 0,
        'totalAgents': 0,
        'totalCandidates': 0,
      };
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _dashboardData,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF6366F1),
              ),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Colors.red[400],
                  ),
                  const SizedBox(height: 12),
                  Text('Error loading dashboard: ${snapshot.error}'),
                ],
              ),
            );
          }

          final data = snapshot.data!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome Header
                _buildWelcomeHeader(data),
                const SizedBox(height: 24),

                // Key Metrics
                _buildKeyMetrics(data),
                const SizedBox(height: 24),

                // Quick Actions Section
                _buildQuickActionsSection(),
                const SizedBox(height: 24),

                // Social Media Links Section
                _buildSocialMediaSection(),
                const SizedBox(height: 24),

                // AI Tools Section
                _buildAIToolsSection(),
                const SizedBox(height: 24),

                // Jobs Management Section
                _buildSectionTitle('Jobs Management'),
                const SizedBox(height: 12),
                _buildJobsMetrics(data),
                const SizedBox(height: 24),

                // WhatsApp Communications Section
                _buildSectionTitle('WhatsApp Communications'),
                const SizedBox(height: 12),
                _buildWhatsAppMetrics(data),
                const SizedBox(height: 24),

                // Applications Section
                _buildSectionTitle('Job Applications'),
                const SizedBox(height: 12),
                _buildApplicationsMetrics(data),
                const SizedBox(height: 24),

                // Platform Users Section
                _buildSectionTitle('Platform Users'),
                const SizedBox(height: 12),
                _buildUsersMetrics(data),
                const SizedBox(height: 24),

                // Recent Activity
                _buildSectionTitle('Recent Activity'),
                const SizedBox(height: 12),
                _buildRecentActivity(),
              ],
            ),
          );
        },
      ),
    );
  }

  // ===== QUICK ACTIONS SECTION =====
  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionButton(
                icon: Icons.chat,
                label: 'WhatsApp',
                color: const Color(0xFF25D366),
                onTap: () => Navigator.pushNamed(context, '/whatsapp'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionButton(
                icon: Icons.send,
                label: 'Bulk Messages',
                color: const Color(0xFF6366F1),
                onTap: () => Navigator.pushNamed(context, '/bulk-whatsapp'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionButton(
                icon: Icons.work,
                label: 'Post Jobs',
                color: const Color(0xFF3B82F6),
                onTap: () => Navigator.pushNamed(context, '/post-jobs'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ===== SOCIAL MEDIA SECTION =====
  Widget _buildSocialMediaSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Social Media Links',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildSocialMediaButton(
                    icon: Icons.facebook,
                    label: 'Facebook',
                    color: const Color(0xFF1877F2),
                    url: 'https://facebook.com/blisscompany',
                  ),
                  _buildSocialMediaButton(
                    icon: Icons.camera_alt,
                    label: 'Instagram',
                    color: const Color(0xFFE1306C),
                    url: 'https://instagram.com/blisscompany',
                  ),
                  _buildSocialMediaButton(
                    icon: Icons.music_note,
                    label: 'TikTok',
                    color: const Color(0xFF000000),
                    url: 'https://tiktok.com/@blisscompany',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildSocialMediaButton(
                    icon: Icons.play_circle,
                    label: 'YouTube',
                    color: const Color(0xFFFF0000),
                    url: 'https://youtube.com/blisscompany',
                  ),
                    _buildSocialMediaButton(
                    icon: Icons.language,
                    label: 'Website',
                    color: const Color(0xFF6366F1),
                    url: 'https://blissconnect.com',
                  ),
                  _buildSocialMediaButton(
                    icon: Icons.mail,
                    label: 'Email',
                    color: const Color(0xFFEA4335),
                    url: 'mailto:contact@blissconnect.com',
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSocialMediaButton({
    required IconData icon,
    required String label,
    required Color color,
    required String url,
  }) {
    return GestureDetector(
      onTap: () {
        debugPrint('Opening: $url');
        // Implement URL launching here using url_launcher package
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Opening $label...')),
        );
      },
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withOpacity(0.1),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ===== AI TOOLS SECTION =====
  Widget _buildAIToolsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AI Tools',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildAIToolCard(
                icon: Icons.image,
                title: 'AI Photo Generator',
                description: 'Generate professional photos with AI',
                color: const Color(0xFF8B5CF6),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Opening AI Photo Generator...'),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              _buildAIToolCard(
                icon: Icons.videocam,
                title: 'AI Video Generator',
                description: 'Create videos with AI assistance',
                color: const Color(0xFFF59E0B),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Opening AI Video Generator...'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAIToolCard({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withOpacity(0.2),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: color),
          ],
        ),
      ),
    );
  }

  // ===== BUILDER METHODS =====

  Widget _buildWelcomeHeader(Map<String, dynamic> data) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Welcome back!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Here\'s your platform overview',
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.trending_up,
                  color: Colors.greenAccent,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Text(
                  'Total Activity: ${data['totalJobs']} + ${data['totalApplications']} updates',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKeyMetrics(Map<String, dynamic> data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Key Performance Indicators',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: Icons.work,
                label: 'Total Jobs',
                value: data['totalJobs'].toString(),
                bgColor: const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.people,
                label: 'Total Applicants',
                value: data['totalApplicants'].toString(),
                bgColor: const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.visibility,
                label: 'Total Views',
                value: data['totalViews'].toString(),
                bgColor: const Color(0xFFF59E0B),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildJobsMetrics(Map<String, dynamic> data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Jobs Posted',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Active',
                  style: TextStyle(
                    color: Color(0xFF8B5CF6),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                'Total Posted',
                data['totalJobs'],
                const Color(0xFF8B5CF6),
              ),
              _buildStatItem(
                'Total Applicants',
                data['totalApplicants'],
                const Color(0xFF10B981),
              ),
              _buildStatItem(
                'Total Views',
                data['totalViews'],
                const Color(0xFFF59E0B),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWhatsAppMetrics(Map<String, dynamic> data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'WhatsApp Communications',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
              const Icon(Icons.chat, color: Color(0xFF25D366), size: 20),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                'Total Messages',
                data['totalWhatsAppMessages'],
                const Color(0xFF25D366),
              ),
              _buildStatItem(
                'Sent',
                data['sentMessages'],
                const Color(0xFF10B981),
              ),
              _buildStatItem(
                'Failed',
                data['failedMessages'],
                const Color(0xFFEF4444),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildApplicationsMetrics(Map<String, dynamic> data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Job Applications Status',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${data['totalApplications']} Total',
                  style: const TextStyle(
                    color: Color(0xFFF59E0B),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                'Pending',
                data['pendingApplications'],
                const Color(0xFFF59E0B),
              ),
              _buildStatItem(
                'Approved',
                data['approvedApplications'],
                const Color(0xFF10B981),
              ),
              _buildStatItem(
                'Rejected',
                data['rejectedApplications'],
                const Color(0xFFEF4444),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUsersMetrics(Map<String, dynamic> data) {
    return Row(
      children: [
        Expanded(
          child: _buildUserCard(
            label: 'Employers',
            value: data['totalEmployers'].toString(),
            icon: Icons.business,
            color: const Color(0xFF6366F1),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildUserCard(
            label: 'Agents',
            value: data['totalAgents'].toString(),
            icon: Icons.person,
            color: const Color(0xFF3B82F6),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildUserCard(
            label: 'Candidates',
            value: data['totalCandidates'].toString(),
            icon: Icons.people,
            color: const Color(0xFF10B981),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivity() {
    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection('activity_log')
          .orderBy('timestamp', descending: true)
          .limit(5)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Center(
              child: Text(
                'No recent activity',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ),
          );
        }

        final activities = snapshot.data!.docs;

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
              ),
            ],
          ),
          child: ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: activities.length,
            itemBuilder: (context, index) {
              final activity = activities[index].data() as Map<String, dynamic>;
              return _buildActivityTile(activity, index);
            },
          ),
        );
      },
    );
  }

  Widget _buildActivityTile(Map<String, dynamic> activity, int index) {
    final isLast = index == 4;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _getActivityColor(activity['type']).withOpacity(0.1),
                ),
                child: Icon(
                  _getActivityIcon(activity['type']),
                  size: 20,
                  color: _getActivityColor(activity['type']),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity['title'] ?? 'Activity',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      activity['description'] ?? 'No description',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (!isLast) Divider(height: 1, color: Colors.grey[200]),
      ],
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required String label,
    required String value,
    required Color bgColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: bgColor.withOpacity(0.15),
            ),
            child: Icon(icon, color: bgColor, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int value, Color color) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildUserCard({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withOpacity(0.15),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1F2937),
      ),
    );
  }

  // ===== HELPER METHODS =====

  Color _getActivityColor(String type) {
    switch (type) {
      case 'job':
        return const Color(0xFF8B5CF6);
      case 'application':
        return const Color(0xFF3B82F6);
      case 'whatsapp':
        return const Color(0xFF25D366);
      case 'user':
        return const Color(0xFF10B981);
      default:
        return const Color(0xFF6366F1);
    }
  }

  IconData _getActivityIcon(String type) {
    switch (type) {
      case 'job':
        return Icons.work;
      case 'application':
        return Icons.person;
      case 'whatsapp':
        return Icons.chat;
      case 'user':
        return Icons.people;
      default:
        return Icons.info;
    }
  }
}
