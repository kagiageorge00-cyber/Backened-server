import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bliss Connect',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const CandidateMarketplaceScreen(),
    );
  }
}

class CandidateMarketplaceScreen extends StatefulWidget {
  const CandidateMarketplaceScreen({super.key});

  @override
  State<CandidateMarketplaceScreen> createState() =>
      _CandidateMarketplaceScreenState();
}

class _CandidateMarketplaceScreenState
    extends State<CandidateMarketplaceScreen> {
  final TextEditingController _searchController = TextEditingController();

  Future<List<Map<String, dynamic>>> _fetchCandidates() async {
    final response = await http.get(
      Uri.parse('${AppConfig.backendUrl}/api/candidates/deployed'),
    );

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
      appBar: AppBar(
        title: const Text("Bliss Candidate Marketplace"),
        centerTitle: true,
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchCandidates(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final candidates = (snapshot.data ?? []).where((candidate) {
            final query = _searchController.text.toLowerCase();
            if (query.isEmpty) return true;
            final country =
                (candidate['country'] ?? '').toString().toLowerCase();
            final skills = (candidate['skills'] ?? '').toString().toLowerCase();
            return country.contains(query) || skills.contains(query);
          }).toList();

          if (candidates.isEmpty) {
            return const Center(child: Text("No deployed candidates found"));
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                child: TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    labelText: 'Search by country or skill',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: candidates.length,
                  itemBuilder: (context, index) {
                    final c = candidates[index];
                    return CandidateCard(
                      data: c,
                      baseUrl: AppConfig.backendUrl,
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ======================
// CANDIDATE CARD
// ======================
class CandidateCard extends StatefulWidget {
  final Map<String, dynamic> data;
  final String baseUrl;

  const CandidateCard({
    super.key,
    required this.data,
    required this.baseUrl,
  });

  @override
  State<CandidateCard> createState() => _CandidateCardState();
}

class _CandidateCardState extends State<CandidateCard> {
  VideoPlayerController? _controller;

  @override
  void initState() {
    super.initState();

    final videoUrl = widget.data['videoUrl'] ?? '';

    if (videoUrl.isNotEmpty) {
      _controller = VideoPlayerController.networkUrl(Uri.parse(videoUrl))
        ..initialize().then((_) {
          setState(() {});
          _controller!.setLooping(true);
        });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  // ======================
  // WHATSAPP
  // ======================
  void _openWhatsApp(String phone) async {
    final url = Uri.parse("https://wa.me/$phone");

    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.data['fullName'] ?? 'No Name';
    final country = widget.data['country'] ?? '';
    final skillsRaw = widget.data['skills'] ?? '';
    final isVerified = widget.data['isVerified'] == true;
    final photo = widget.data['photoUrl'] ?? '';
    final phone = widget.data['phone'] ?? '';

    final skills = skillsRaw.toString().split(',');

    return Card(
      margin: const EdgeInsets.all(10),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // HEADER
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundImage:
                      photo.isNotEmpty ? NetworkImage(photo) : null,
                  child: photo.isEmpty ? const Icon(Icons.person) : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(width: 6),
                          if (isVerified)
                            const Icon(Icons.verified,
                                color: Colors.green, size: 18),
                        ],
                      ),
                      Text(country),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // SKILLS
            Wrap(
              spacing: 6,
              children: skills.map((s) => Chip(label: Text(s.trim()))).toList(),
            ),

            const SizedBox(height: 10),

            // PERSONAL & PROFESSIONAL INFORMATION
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow("Nationality", widget.data['nationality'] ?? 'N/A'),
                  _infoRow(
                      "Marital Status", widget.data['maritalStatus'] ?? 'N/A'),
                  _infoRow("Number of Children",
                      (widget.data['numberOfChildren'] ?? 'N/A').toString()),
                  _infoRow("Religion", widget.data['religion'] ?? 'N/A'),
                  _infoRow("Educational Level",
                      widget.data['educationalLevel'] ?? 'N/A'),
                  if (widget.data['applicationDate'] != null)
                    _infoRow(
                        "Application Date",
                        widget.data['applicationDate']
                            .toString()
                            .split(' ')[0]),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // VIDEO
            if (_controller != null && _controller!.value.isInitialized)
              AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              ),

            if (_controller != null)
              IconButton(
                icon: Icon(
                  _controller!.value.isPlaying ? Icons.pause : Icons.play_arrow,
                ),
                onPressed: () {
                  setState(() {
                    _controller!.value.isPlaying
                        ? _controller!.pause()
                        : _controller!.play();
                  });
                },
              ),

            const SizedBox(height: 10),

            // ACTION BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: phone.isNotEmpty ? () => _openWhatsApp(phone) : null,
                icon: const Icon(Icons.chat),
                label: const Text("Contact on WhatsApp"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper method to display info rows
  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Text(value),
        ],
      ),
    );
  }
}
