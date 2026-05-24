import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../services/candidate_video_service.dart';
import 'widgets/design_system.dart';
import 'widgets/ats_pipeline.dart';
import 'widgets/deployment.dart';
import 'widgets/dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase initialization removed for backend migration
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Candidate Marketplace',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const CandidateMarketplaceScreen(),
    );
  }
}

class CandidateMarketplaceScreen extends StatefulWidget {
  const CandidateMarketplaceScreen({super.key});

  @override
  State<CandidateMarketplaceScreen> createState() => _CandidateMarketplaceScreenState();
}

class _CandidateMarketplaceScreenState extends State<CandidateMarketplaceScreen> {
  String _search = '';
  final TextEditingController _searchController = TextEditingController();
  bool _sortBySalaryDesc = true;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> candidates) {
    final filtered = candidates.where((d) {
      // TODO: implement actual filter logic (search, sort)
      return true;
    }).toList();
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchCandidates(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Error loading candidates'));
          }
          if (!snapshot.hasData || (snapshot.data as List).isEmpty) {
            return SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text('No candidates found', style: TextStyle(fontSize: 18)),
                ],
              ),
            );
          }

              final candidates = snapshot.data as List<Map<String, dynamic>>;
              final docs = _applyFilters(candidates);

          return SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverAppBar(
                  pinned: true,
                  expandedHeight: 160,
                  backgroundColor: Colors.transparent,
                  flexibleSpace: FlexibleSpaceBar(
                    titlePadding: const EdgeInsetsDirectional.only(start: 16, bottom: 12),
                    title: const Text('Candidate Marketplace', style: TextStyle(fontSize: 16)),
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF0F2027), Color(0xFF2C5364)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Discover top talent', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          const Text('Fast, verified candidate videos and profiles to hire smarter.', style: TextStyle(color: Colors.white70)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  height: 42,
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                                  child: TextField(
                                    controller: _searchController,
                                    onChanged: (v) => setState(() => _search = v),
                                    decoration: const InputDecoration(
                                      hintText: 'Search by name or skill (e.g. Sales, Java)',
                                      prefixIcon: Icon(Icons.search),
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () => setState(() => _sortBySalaryDesc = !_sortBySalaryDesc),
                                child: Chip(
                                  backgroundColor: Colors.white24,
                                  label: Text(_sortBySalaryDesc ? 'Top Salary' : 'Lowest Salary', style: const TextStyle(color: Colors.white)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Featured Candidates', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 160,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: docs.length > 6 ? 6 : docs.length,
                            itemBuilder: (context, i) {
                              final data = docs[i];
                              return Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: FeaturedTile(
                                  name: data['fullName'] ?? 'No Name',
                                  role: data['title'] ?? '',
                                  photoUrl: data['photoUrl'] ?? '',
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text('All Candidates', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ),

                SliverList.builder(
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final data = docs[index];
                    final name = data['fullName'] ?? 'No Name';
                    final country = data['country'] ?? 'Unknown';
                    final salary = data['expectedSalary'] ?? 0;
                    final skills = List<String>.from(data['skills'] ?? []);
                    final videoUrl = data['videoUrl'] ?? '';

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: CandidateCard(
                        name: name,
                        country: country,
                        salary: salary,
                        skills: skills,
                        videoUrl: videoUrl,
                      ),
                    );
                  },
                  // Fetch candidates from backend
                  Future<List<Map<String, dynamic>>> _fetchCandidates() async {
                    final candidates = await CandidateVideoService.getApprovedCandidates();
                    // Ensure all items are Map<String, dynamic>
                    return candidates.map((e) => Map<String, dynamic>.from(e)).toList();
                  }
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
      // Fetch candidates from backend
      Future<List<Map<String, dynamic>>> _fetchCandidates() async {
        final response = await http.post(
          Uri.parse('https://backened-server.onrender.com/candidates_marketplace'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({}), // Add filters if needed
        );
        print("STATUS: ${response.statusCode}");
        print("BODY: ${response.body}");
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['success'] == true && data['candidates'] is List) {
            return List<Map<String, dynamic>>.from(data['candidates']);
          } else {
            throw Exception(data['error'] ?? data['message'] ?? 'Failed to load candidates');
          }
        } else {
          throw Exception('Failed to load candidates');
        }
      }

class CandidateCard extends StatefulWidget {
  final String name;
  final String country;
  final dynamic salary;
  final List<String> skills;
  final String videoUrl;

  const CandidateCard({
    super.key,
    required this.name,
    required this.country,
    required this.salary,
    required this.skills,
    required this.videoUrl,
  });

  @override
  State<CandidateCard> createState() => _CandidateCardState();
}

class _CandidateCardState extends State<CandidateCard> {
  VideoPlayerController? _videoController;

  @override
  void initState() {
    super.initState();
    if (widget.videoUrl.isNotEmpty) {
      _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl))
        ..initialize().then((_) {
          setState(() {});
          _videoController!.setLooping(true);
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 6,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(12),
                    image: null,
                  ),
                  child: const Icon(Icons.person, size: 36, color: Colors.grey),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade600),
                          const SizedBox(width: 6),
                          Text(widget.country, style: TextStyle(color: Colors.grey.shade700)),
                          const SizedBox(width: 12),
                          Text('•', style: TextStyle(color: Colors.grey.shade500)),
                          const SizedBox(width: 8),
                          Text('${widget.salary} ${widget.salary is num ? 'USD' : ''}', style: TextStyle(color: Colors.grey.shade700)),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () {},
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: widget.skills.take(6).map((s) => Chip(label: Text(s))).toList(),
            ),
            const SizedBox(height: 10),
            if (_videoController != null && _videoController!.value.isInitialized)
              AspectRatio(
                aspectRatio: _videoController!.value.aspectRatio,
                child: ClipRRect(borderRadius: BorderRadius.circular(8), child: VideoPlayer(_videoController!)),
              ),
            if (_videoController != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(_videoController!.value.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, color: Theme.of(context).primaryColor, size: 28),
                    onPressed: () {
                      setState(() {
                        _videoController!.value.isPlaying ? _videoController!.pause() : _videoController!.play();
                      });
                    },
                  ),
                ],
              ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.star_border),
                    label: const Text('Shortlist'),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Candidate shortlisted')));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.send),
                    label: const Text('Request Interview'),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Interview requested')));
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
