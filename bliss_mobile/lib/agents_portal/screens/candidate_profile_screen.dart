import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/candidate_model.dart';
import '../constants/colors.dart';
import '../constants/styles.dart';
import 'candidate_verification_screen.dart';
import 'package:video_player/video_player.dart';

class CandidateProfileScreen extends StatefulWidget {
  final String candidateId;
  const CandidateProfileScreen({super.key, required this.candidateId});

  @override
  State<CandidateProfileScreen> createState() => _CandidateProfileScreenState();
}

class _CandidateProfileScreenState extends State<CandidateProfileScreen> {
  VideoPlayerController? _videoController;

  Future<CandidateModel> _fetchCandidate() async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/getCandidate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'candidateId': widget.candidateId}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load candidate');
    }

    final payload = jsonDecode(response.body);
    if (payload['success'] != true || payload['candidate'] == null) {
      throw Exception('Candidate not found');
    }

    final data = Map<String, dynamic>.from(payload['candidate']);
    final candidate = CandidateModel.fromMap(data, widget.candidateId);

    // Initialize video if available
    if (candidate.videoUrl.isNotEmpty) {
      _videoController =
          VideoPlayerController.networkUrl(Uri.parse(candidate.videoUrl));
      await _videoController!.initialize();
    }

    return candidate;
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<CandidateModel>(
      future: _fetchCandidate(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError) {
          return Scaffold(
            body: Center(child: Text("Error: ${snapshot.error}")),
          );
        }

        final candidate = snapshot.data!;

        return Scaffold(
          appBar: AppBar(
            title: Text(candidate.fullName),
            backgroundColor: AppColors.primary,
            actions: [
              IconButton(
                icon: const Icon(Icons.verified),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          CandidateVerificationScreen(candidate: candidate),
                    ),
                  );
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // PROFILE IMAGE WITH SHADOW
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 8,
                      )
                    ],
                  ),
                  child: CircleAvatar(
                    radius: 65,
                    backgroundImage: candidate.photoUrl.isNotEmpty
                        ? NetworkImage(candidate.photoUrl)
                        : null,
                    child: candidate.photoUrl.isEmpty
                        ? const Icon(Icons.person, size: 60)
                        : null,
                  ),
                ),
                const SizedBox(height: 16),

                // NAME & SKILLS IN CONTAINER
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 8,
                      )
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(candidate.fullName, style: AppStyles.heading2),
                          const SizedBox(height: 8),
                          Text(candidate.skills, style: AppStyles.bodyText),
                          const SizedBox(height: 8),
                          Text("Experience: ${candidate.experience}",
                              style: AppStyles.bodyText),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // CV BUTTON WITH STYLING
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 8,
                      )
                    ],
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.description),
                      label: const Text("View CV"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: candidate.cvUrl.isEmpty
                          ? null
                          : () {
                              // TODO: open CV (PDF viewer or url_launcher)
                            },
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // VIDEO SECTION WITH STYLING
                if (_videoController != null &&
                    _videoController!.value.isInitialized)
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 8,
                        )
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Column(
                        children: [
                          AspectRatio(
                            aspectRatio: _videoController!.value.aspectRatio,
                            child: VideoPlayer(_videoController!),
                          ),
                          Container(
                            color: Colors.grey[900],
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                IconButton(
                                  icon: Icon(
                                    _videoController!.value.isPlaying
                                        ? Icons.pause
                                        : Icons.play_arrow,
                                    size: 32,
                                    color: Colors.white,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _videoController!.value.isPlaying
                                          ? _videoController!.pause()
                                          : _videoController!.play();
                                    });
                                  },
                                ),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
