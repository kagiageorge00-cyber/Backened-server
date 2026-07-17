import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:video_player/video_player.dart';

import '../config/app_config.dart';
import '../debug/error_store.dart';
import '../widgets/CandidateMarketplaceCard.dart';

class CandidateMarketplaceScreen extends StatelessWidget {
  const CandidateMarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("BLISS CONNECT'S CANDIDATE MARKETPLACE"),
        centerTitle: true,
      ),
      body: const CandidateMarketplaceBody(),
    );
  }
}

class CandidateMarketplaceBody extends StatefulWidget {
  const CandidateMarketplaceBody({super.key});

  @override
  State<CandidateMarketplaceBody> createState() =>
      _CandidateMarketplaceBodyState();
}

class _CandidateMarketplaceBodyState extends State<CandidateMarketplaceBody> {
  final TextEditingController _searchController = TextEditingController();
  String _filterCountry = '';
  String _filterRole = '';
  String _filterExperience = '';

  List<Map<String, dynamic>> _candidates = [];
  bool _loading = false;
  String? _selectedCandidateId;
  String? _selectedCandidateName;

  @override
  void initState() {
    super.initState();
    _fetchCandidates();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchCandidates() async {
    setState(() => _loading = true);
    try {
      final url = '${AppConfig.backendUrl}/api/candidates/marketplace';
      final res = await http.get(Uri.parse(url));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final items = data is Map && data['data'] != null
            ? List.from(data['data'])
            : (data is List ? List.from(data) : <dynamic>[]);
        _candidates = items
            .map<Map<String, dynamic>>((e) => e as Map<String, dynamic>)
            .toList();
      } else {
        ErrorStore.setError('Marketplace fetch failed: ${res.statusCode}');
        _candidates = [];
      }
    } catch (e) {
      ErrorStore.setError('Marketplace fetch error: $e');
      _candidates = [];
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _searchableText(Map<String, dynamic> c) {
    final parts = <String>[];
    parts.add((c['fullName'] ?? c['name'] ?? '').toString());
    parts.add(
        (c['candidateId'] ?? c['uniqueCode'] ?? c['_id'] ?? '').toString());
    parts.add((c['jobAppliedFor'] ??
            c['position'] ??
            c['role'] ??
            c['jobTitle'] ??
            '')
        .toString());
    parts.add((c['country'] ?? c['nationality'] ?? '').toString());
    final skills = c['skills'] ?? c['skillsList'] ?? c['skillsLabel'] ?? '';
    if (skills is Iterable)
      parts.addAll(skills.map((s) => s.toString()));
    else
      parts.add(skills.toString());
    final langs = c['languages'] ?? c['language'] ?? c['spokenLanguages'] ?? '';
    if (langs is Iterable)
      parts.addAll(langs.map((l) => l.toString()));
    else
      parts.add(langs.toString());
    parts.add((c['introduction'] ?? c['bio'] ?? c['summary'] ?? '').toString());
    return parts.join(' ').toLowerCase();
  }

  List<Map<String, dynamic>> _featuredCandidates(
      List<Map<String, dynamic>> list) {
    final hits = <Map<String, dynamic>>[];
    for (final c in list) {
      final isFeatured = c['featured'] == true ||
          c['isFeatured'] == true ||
          c['priority'] == 'high';
      final hasVideo =
          (c['videoUrl'] ?? c['introductionVideo'] ?? c['video'] ?? '')
              .toString()
              .isNotEmpty;
      final isVerified = c['isVerified'] == true || c['verified'] == true;
      if (isFeatured || hasVideo || isVerified) hits.add(c);
    }
    return hits;
  }

  void _selectCandidate(Map<String, dynamic> candidate) {
    final id = (candidate['candidateId'] ??
            candidate['uniqueCode'] ??
            candidate['_id'] ??
            '')
        .toString();
    final name = (candidate['fullName'] ?? candidate['name'] ?? '').toString();
    setState(() {
      _selectedCandidateId = id.isNotEmpty ? id : null;
      _selectedCandidateName = name.isNotEmpty ? name : null;
    });
  }

  String _resolvePhotoUrl(Map<String, dynamic> candidate) {
    final photo = candidate['fullPhoto'] ??
        candidate['photoUrl'] ??
        candidate['profilePhoto'] ??
        candidate['profileUrl'] ??
        candidate['photo'];
    final url = photo?.toString() ?? '';
    if (url.isEmpty) return '';
    final uri = Uri.tryParse(url);
    if (uri == null ||
        !(uri.isAbsolute && (uri.scheme == 'http' || uri.scheme == 'https')))
      return '';
    final host = uri.host.toLowerCase();
    if (host.contains('localhost') ||
        host.contains('127.0.0.1') ||
        host.contains('example.com')) return '';
    return url;
  }

  bool _hasVideo(Map<String, dynamic> candidate) {
    final v = candidate['videoUrl'] ??
        candidate['introductionVideo'] ??
        candidate['video'] ??
        candidate['introVideo'];
    return v != null && v.toString().trim().isNotEmpty;
  }

  String _resolveIntroduction(Map<String, dynamic> candidate) {
    final fields = [
      candidate['introduction'],
      candidate['shortIntroduction'],
      candidate['bio'],
      candidate['summary'],
      candidate['about'],
      candidate['aboutMe'],
      candidate['description'],
      candidate['intro'],
    ];
    for (final f in fields) {
      if (f is String && f.trim().isNotEmpty) {
        final txt = f.trim().replaceAll(RegExp(r'\s+'), ' ');
        return txt.length > 140 ? '${txt.substring(0, 137)}...' : txt;
      }
    }
    final role = (candidate['jobAppliedFor'] ??
            candidate['position'] ??
            candidate['role'] ??
            candidate['jobTitle'] ??
            '')
        .toString();
    final country =
        (candidate['country'] ?? candidate['nationality'] ?? '').toString();
    final roleText = role.isNotEmpty ? role : 'professional opportunities';
    final countryText = country.isNotEmpty ? ' in $country' : '';
    return 'Professional candidate with strong experience in $roleText$countryText and a dependable, work-focused approach.';
  }

  @override
  Widget build(BuildContext context) {
    final all = _candidates;
    final filtered = all.where((candidate) {
      final q = _searchController.text.trim().toLowerCase();
      final t = _searchableText(candidate);
      if (q.isNotEmpty && !t.contains(q)) return false;
      if (_filterCountry.isNotEmpty &&
          (candidate['country'] ?? candidate['nationality'] ?? '')
                  .toString()
                  .toLowerCase() !=
              _filterCountry.toLowerCase()) return false;
      if (_filterRole.isNotEmpty &&
          !(candidate['jobAppliedFor'] ??
                  candidate['position'] ??
                  candidate['role'] ??
                  candidate['jobTitle'] ??
                  '')
              .toString()
              .toLowerCase()
              .contains(_filterRole.toLowerCase())) return false;
      if (_filterExperience.isNotEmpty &&
          !(candidate['experience'] ?? candidate['yearsOfExperience'] ?? '')
              .toString()
              .toLowerCase()
              .contains(_filterExperience.toLowerCase())) return false;
      return true;
    }).toList();

    final featured = _featuredCandidates(filtered);
    final total = all.length;
    final verified = all.where((c) => c['isVerified'] == true).length;
    final available = all
        .where((c) => (c['availability'] ?? 'Available') == 'Available')
        .length;

    final countryOptions = filtered
        .map((c) => (c['country'] ?? c['nationality'] ?? '').toString())
        .where((s) => s.trim().isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    final roleOptions = filtered
        .map((c) => (c['jobAppliedFor'] ??
                c['position'] ??
                c['role'] ??
                c['jobTitle'] ??
                '')
            .toString())
        .where((s) => s.trim().isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    final experienceOptions = filtered
        .map(
            (c) => (c['experience'] ?? c['yearsOfExperience'] ?? '').toString())
        .where((s) => s.trim().isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
          decoration: BoxDecoration(color: Colors.blue.shade900, boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.16), blurRadius: 10)
          ]),
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('BLISS CONNECT MARKETPLACE',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text(
                    'Browse verified candidates with full photo profiles and intro videos for employer trust. Every listing is curated for quality and fast hiring.',
                    style: TextStyle(color: Colors.white70, fontSize: 14)),
              ]),
        ),
        const SizedBox(height: 12),
        if (featured.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: const [
                Icon(Icons.star, color: Colors.amber, size: 20),
                SizedBox(width: 6),
                Text('Featured Candidates',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))
              ]),
              const SizedBox(height: 8),
              SizedBox(
                height: 220,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: featured.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => SizedBox(
                      width: 220,
                      child: _featuredCandidateCard(featured[index])),
                ),
              ),
            ]),
          ),
        if (featured.isNotEmpty) const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              _statCard('Total', total.toString()),
              const SizedBox(width: 8),
              _statCard('Verified', verified.toString()),
              const SizedBox(width: 8),
              _statCard('Available', available.toString()),
              const Spacer(),
            ]),
            const SizedBox(height: 12),
            Column(children: [
              TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      labelText:
                          'Search by name, ID, role, country, skills, experience...',
                      border: OutlineInputBorder())),
              const SizedBox(height: 12),
              Wrap(spacing: 12, runSpacing: 12, children: [
                SizedBox(
                    width: 170,
                    child: DropdownButtonFormField<String>(
                        value: _filterCountry.isEmpty ? null : _filterCountry,
                        items: [
                          const DropdownMenuItem(
                              value: '', child: Text('Country')),
                          ...countryOptions.map((country) => DropdownMenuItem(
                              value: country, child: Text(country)))
                        ],
                        onChanged: (value) =>
                            setState(() => _filterCountry = value ?? ''),
                        decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12, vertical: 14)))),
                SizedBox(
                    width: 170,
                    child: DropdownButtonFormField<String>(
                        value: _filterRole.isEmpty ? null : _filterRole,
                        items: [
                          const DropdownMenuItem(
                              value: '', child: Text('Job Category')),
                          ...roleOptions.map((role) =>
                              DropdownMenuItem(value: role, child: Text(role)))
                        ],
                        onChanged: (value) =>
                            setState(() => _filterRole = value ?? ''),
                        decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12, vertical: 14)))),
                SizedBox(
                    width: 140,
                    child: DropdownButtonFormField<String>(
                        value: _filterExperience.isEmpty
                            ? null
                            : _filterExperience,
                        items: [
                          const DropdownMenuItem(
                              value: '', child: Text('Experience')),
                          ...experienceOptions.map((exp) =>
                              DropdownMenuItem(value: exp, child: Text(exp)))
                        ],
                        onChanged: (value) =>
                            setState(() => _filterExperience = value ?? ''),
                        decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12, vertical: 14)))),
                ElevatedButton(
                    onPressed: () => setState(() {}),
                    child: const Padding(
                        padding:
                            EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Text('Search'))),
                OutlinedButton(
                    onPressed: () => setState(() {
                          _filterCountry = '';
                          _filterRole = '';
                          _filterExperience = '';
                          _searchController.clear();
                        }),
                    child: const Padding(
                        padding:
                            EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Text('Reset'))),
              ])
            ])
          ]),
        ),
        if (_selectedCandidateId != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200)),
                child: Text(
                    'Selected candidate: ${_selectedCandidateName ?? 'Unknown'} ($_selectedCandidateId)',
                    style: TextStyle(
                        color: Colors.green.shade900,
                        fontWeight: FontWeight.w600))),
          ),
        Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : (filtered.isEmpty
                    ? const Center(child: Text('No candidates found'))
                    : LayoutBuilder(builder: (context, constraints) {
                        final width = constraints.maxWidth;
                        final crossAxisCount = width >= 900 ? 2 : 1;
                        final childAspectRatio = width >= 900 ? 0.88 : 0.95;
                        return GridView.builder(
                            padding: const EdgeInsets.all(12),
                            gridDelegate:
                                SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 12,
                                    childAspectRatio: childAspectRatio),
                            itemCount: filtered.length,
                            itemBuilder: (context, idx) =>
                                CandidateMarketplaceCard(
                                    data: filtered[idx],
                                    isSelected: _selectedCandidateId ==
                                        (filtered[idx]['candidateId'] ??
                                                filtered[idx]['uniqueCode'] ??
                                                filtered[idx]['_id'] ??
                                                '')
                                            .toString(),
                                    onSelect: () =>
                                        _selectCandidate(filtered[idx])));
                      })))
      ],
    );
  }

  Widget _featuredCandidateCard(Map<String, dynamic> candidate) {
    final name = candidate['fullName'] ?? candidate['name'] ?? 'Candidate';
    final role = (candidate['jobAppliedFor'] ??
            candidate['position'] ??
            candidate['role'] ??
            candidate['jobTitle'] ??
            '')
        .toString();
    final country =
        (candidate['country'] ?? candidate['nationality'] ?? '').toString();
    final photo = _resolvePhotoUrl(candidate);
    final hasVideo = _hasVideo(candidate);
    final isVerified =
        candidate['isVerified'] == true || candidate['verified'] == true;
    final introduction = _resolveIntroduction(candidate);

    return Card(
      elevation: 4,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => _selectCandidate(candidate),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
              height: 112,
              width: double.infinity,
              child: photo.isNotEmpty
                  ? Image.network(photo,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey.shade200,
                          child: const Center(
                              child: Icon(Icons.person, size: 48))))
                  : Container(
                      color: Colors.grey.shade200,
                      child:
                          const Center(child: Icon(Icons.person, size: 48)))),
          Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(
                          child: Text(name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold))),
                      if (isVerified)
                        const Icon(Icons.verified,
                            color: Colors.green, size: 16)
                    ]),
                    const SizedBox(height: 4),
                    Text(role.isNotEmpty ? role : 'Professional candidate',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Colors.grey.shade700, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(country.isNotEmpty ? country : 'Open to opportunities',
                        style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 8),
                    Text(introduction,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 12,
                            height: 1.35)),
                    const SizedBox(height: 8),
                    Wrap(spacing: 6, runSpacing: 4, children: [
                      if (isVerified) _featuredChip('Verified'),
                      if (hasVideo) _featuredChip('Video'),
                      _featuredChip('Top Match')
                    ])
                  ]))
        ]),
      ),
    );
  }

  Widget _featuredChip(String label) {
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(999)),
        child: Text(label,
            style: TextStyle(
                fontSize: 11,
                color: Colors.blue.shade900,
                fontWeight: FontWeight.w600)));
  }

  Widget _statCard(String title, String value) {
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey.shade200)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(color: Colors.grey[700])),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))
        ]));
  }

  void _showVideo(BuildContext context, String videoUrl) {
    if (videoUrl.isEmpty) return;
    showDialog(
        context: context,
        builder: (_) => AlertDialog(
                title: const Text('Candidate Intro Video'),
                content: SizedBox(
                    width: 560,
                    height: 320,
                    child: CandidateVideoPlayerDialog(videoUrl: videoUrl)),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'))
                ]));
  }
}

class CandidateVideoPlayerDialog extends StatefulWidget {
  final String videoUrl;
  const CandidateVideoPlayerDialog({super.key, required this.videoUrl});

  @override
  State<CandidateVideoPlayerDialog> createState() =>
      _CandidateVideoPlayerDialogState();
}

class _CandidateVideoPlayerDialogState
    extends State<CandidateVideoPlayerDialog> {
  VideoPlayerController? _controller;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    try {
      _controller =
          VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      await _controller!.initialize();
      await _controller!.setLooping(false);
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null)
      return Center(
          child: Text(
              'Unable to load video. Please use the candidate profile or contact support.'));
    if (_controller == null || !_controller!.value.isInitialized)
      return const Center(
          child: Text('Video cannot be played in this dialog.'));
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Expanded(
          child: AspectRatio(
              aspectRatio: _controller!.value.aspectRatio,
              child: VideoPlayer(_controller!))),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        IconButton(
            icon: Icon(
                _controller!.value.isPlaying ? Icons.pause : Icons.play_arrow),
            onPressed: () {
              setState(() {
                if (_controller!.value.isPlaying)
                  _controller!.pause();
                else
                  _controller!.play();
              });
            }),
        const SizedBox(width: 12),
        Text(_controller!.value.isPlaying ? 'Pause video' : 'Play video',
            style: const TextStyle(fontWeight: FontWeight.w600))
      ])
    ]);
  }
}
