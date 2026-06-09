import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../services/backend_auth.dart';
import '../services/auth_service.dart';
import '../employers_portal/service/interview_service.dart';
import 'candidate_profile_screen.dart';

class CandidateMarketplaceScreen extends StatefulWidget {
  const CandidateMarketplaceScreen({super.key});

  @override
  State<CandidateMarketplaceScreen> createState() => _CandidateMarketplaceScreenState();
}

class _CandidateMarketplaceScreenState extends State<CandidateMarketplaceScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _filterCountry = '';
  String _filterSkill = '';

  Future<List<Map<String, dynamic>>> _fetchCandidates() async {
    final response = await http.get(Uri.parse('${AppConfig.backendUrl}/api/candidates/deployed'));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      }
    }

    return [];
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BLISS VERIFIED TALENT MARKETPLACE'), centerTitle: true),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchCandidates(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final all = snapshot.data ?? [];

          final filtered = all.where((candidate) {
            final q = _searchController.text.toLowerCase();
            if (q.isNotEmpty) {
              final country = (candidate['country'] ?? '').toString().toLowerCase();
              final skills = (candidate['skills'] ?? '').toString().toLowerCase();
              if (!country.contains(q) && !skills.contains(q) && !(candidate['fullName'] ?? '').toString().toLowerCase().contains(q)) return false;
            }
            if (_filterCountry.isNotEmpty && (candidate['country'] ?? '').toString().toLowerCase() != _filterCountry) return false;
            if (_filterSkill.isNotEmpty) {
              final skills = (candidate['skills'] ?? '').toString().toLowerCase();
              if (!skills.contains(_filterSkill)) return false;
            }
            return true;
          }).toList();

          final total = all.length;
          final verified = all.where((c) => c['isVerified'] == true).length;
          final available = all.where((c) => (c['availability'] ?? 'Available') == 'Available').length;

          return Column(
            children: [
              // Header counters and search
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      _statCard('Total', total.toString()),
                      const SizedBox(width: 8),
                      _statCard('Verified', verified.toString()),
                      const SizedBox(width: 8),
                      _statCard('Available', available.toString()),
                      const Spacer(),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (_) => setState(() {}),
                          decoration: const InputDecoration(prefixIcon: Icon(Icons.search), labelText: 'Search candidates, country or skill', border: OutlineInputBorder()),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(onPressed: () => _showFilters(), child: const Text('Filters')),
                    ]),
                  ],
                ),
              ),

              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('No candidates found'))
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) => CandidateCard(data: filtered[idx]),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _statCard(String title, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.grey.shade200)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: TextStyle(color: Colors.grey[700])), const SizedBox(height: 6), Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))]),
    );
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(12),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(decoration: const InputDecoration(labelText: 'Country (exact)'), onChanged: (v) => _filterCountry = v.toLowerCase()),
            const SizedBox(height: 8),
            TextField(decoration: const InputDecoration(labelText: 'Skill (contains)'), onChanged: (v) => _filterSkill = v.toLowerCase()),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: () { setState(() {}); Navigator.pop(ctx); }, child: const Text('Apply')),
          ]),
        );
      },
    );
  }
}

// ==================
// Candidate Card
// ==================
class CandidateCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const CandidateCard({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final name = data['fullName'] ?? 'No Name';
    final photo = data['photoUrl'] ?? '';
    final isVerified = data['isVerified'] == true;
    final candidateId = data['candidateId'] ?? '';
    final country = data['country'] ?? '';
    final experience = data['yearsOfExperience'] ?? data['experienceYears'] ?? '0';
    final availability = data['availability'] ?? 'Available';
    final skills = (data['skills'] ?? '').toString().split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();

    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.hardEdge,
      child: LayoutBuilder(builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 600;
        return isMobile ? _buildVertical(context, photo, name, candidateId, country, experience, availability, skills) : _buildHorizontal(context, photo, name, candidateId, country, experience, availability, skills);
      }),
    );
  }

  Widget _buildHorizontal(BuildContext context, String photo, String name, String candidateId, String country, dynamic experience, String availability, List<String> skills) {
    return SizedBox(
      height: 320,
      child: Row(children: [
        // Photo
        Container(
          width: 360,
          color: Colors.grey[200],
          child: photo.isNotEmpty ? Image.network(photo, fit: BoxFit.cover, width: 360, height: double.infinity, errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 64)) : const Center(child: Icon(Icons.person, size: 64)),
        ),

        // Details
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Expanded(child: Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))), if (isVerified) const Icon(Icons.verified, color: Colors.teal), const SizedBox(width: 8), Text(candidateId, style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.w600))]),
              const SizedBox(height: 8),
              Row(children: [Text(country, style: TextStyle(color: Colors.grey[700])), const SizedBox(width: 12), Text('$experience yrs', style: TextStyle(fontWeight: FontWeight.w600)), const Spacer(), Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: availability == 'Available' ? Colors.green[50] : Colors.orange[50], borderRadius: BorderRadius.circular(8)), child: Text(availability, style: TextStyle(color: availability == 'Available' ? Colors.green[800] : Colors.orange[800], fontWeight: FontWeight.w700)))),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 6, children: skills.take(8).map((s) => Chip(label: Text(s), backgroundColor: Colors.blueGrey[50])).toList()),
              const Spacer(),
              Row(children: [
                ElevatedButton(onPressed: () => _viewProfile(context), child: const Text('View Candidate')),
                const SizedBox(width: 12),
                OutlinedButton(onPressed: () => _onInterview(context), child: const Text('Interview Candidate')),
                const Spacer(),
                if ((data['videoUrl'] ?? '').toString().isNotEmpty) IconButton(onPressed: () => _playVideo(context), icon: const Icon(Icons.play_circle_fill, size: 32)),
              ])
            ]),
          ),
        )
      ]),
    );
  }

  Widget _buildVertical(BuildContext context, String photo, String name, String candidateId, String country, dynamic experience, String availability, List<String> skills) {
    return SizedBox(
      child: Column(children: [
        SizedBox(height: 220, width: double.infinity, child: photo.isNotEmpty ? Image.network(photo, fit: BoxFit.cover, width: double.infinity) : const Center(child: Icon(Icons.person, size: 64))),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))), if (isVerified) const Icon(Icons.verified, color: Colors.teal), const SizedBox(width: 8), Text(candidateId, style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.w600))]),
            const SizedBox(height: 8),
            Row(children: [Text(country), const SizedBox(width: 12), Text('$experience yrs')]),
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6, children: skills.take(6).map((s) => Chip(label: Text(s))).toList()),
            const SizedBox(height: 12),
            Row(children: [Expanded(child: ElevatedButton(onPressed: () => _viewProfile(context), child: const Text('View Candidate'))), const SizedBox(width: 8), OutlinedButton(onPressed: () => _onInterview(context), child: const Text('Interview Candidate'))]),
          ]),
        )
      ]),
    );
  }

  void _viewProfile(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => CandidateProfileScreen(data: data)));
  }

  void _playVideo(BuildContext context) {
    // Open a simple dialog with video player or open external URL — keep simple for now
    final url = data['videoUrl'] ?? '';
    if (url.isEmpty) return;
    showDialog(context: context, builder: (_) => AlertDialog(content: SizedBox(width: 560, height: 320, child: Center(child: Text('Video playback not implemented in this build. Open: $url'))), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))]));
  }

  Future<void> _onInterview(BuildContext context) async {
    // Employer must be authenticated
    if (!BackendAuth.isAuthenticated) {
      // Redirect to employer login
      Navigator.pushNamed(context, '/employer-login');
      return;
    }

    final employerId = BackendAuth.userId ?? '';
    final employer = await AuthService().getCurrentUser();
    final employerName = employer?.displayName ?? employer?.email ?? 'Employer';

    // Create interview record in firestore with status 'pending' and do NOT trigger notifications here
    final interview = {
      'candidateId': data['candidateId'] ?? data['_id'] ?? '',
      'employerId': employerId,
      'employerName': employerName,
      'status': 'pending',
      'createdAt': DateTime.now().toIso8601String(),
    };

    try {
      // Use InterviewService to schedule (it writes to Firestore)
      final svc = InterviewService();
      // interview model in app expects a typed object; to keep patch minimal create a small wrapper Interview-like map-based write
      await svc.scheduleInterviewFromMap(interview);

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Interview request created — employer will schedule the interview.')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create interview: $e')));
    }
  }
}
