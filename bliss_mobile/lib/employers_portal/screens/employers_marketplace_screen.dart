// lib/employer_portal/screens/employers_marketplace_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';
import '../../services/backend_auth.dart';
import '../widgets/candidate_card.dart';

class EmployersMarketplaceScreen extends StatefulWidget {
  final String employerId; // to filter candidates posted by this employer

  const EmployersMarketplaceScreen({super.key, required this.employerId});

  @override
  State<EmployersMarketplaceScreen> createState() =>
      _EmployersMarketplaceScreenState();
}

class _EmployersMarketplaceScreenState
    extends State<EmployersMarketplaceScreen> {
  final TextEditingController _searchController = TextEditingController();
  String searchQuery = "";

  void _searchCandidate(String query) {
    setState(() {
      searchQuery = query.toLowerCase();
    });
  }

  Future<List<Map<String, dynamic>>> _fetchCandidates() async {
    final resp =
        await http.get(Uri.parse('${AppConfig.backendUrl}/api/marketplace'));
    if (resp.statusCode != 200) throw Exception('Failed to load candidates');
    final data = jsonDecode(resp.body);
    final List list = data['data'] ?? data['candidates'] ?? [];
    return list.map((e) {
      final m = Map<String, dynamic>.from(e as Map);
      if (!m.containsKey('id') && m.containsKey('_id')) m['id'] = m['_id'];
      return m;
    }).toList();
  }

  void _handleSchedule(BuildContext context, Map<String, dynamic> candidate) {
    if (!BackendAuth.isAuthenticated) {
      // Not logged in: redirect to employer login/register and return here
      Navigator.pushNamed(context, '/employer-login', arguments: {
        'returnRoute': '/schedule-interview',
        'returnArgs': {
          'candidateId': candidate['id'],
          'candidateName': candidate['name'],
        },
      });
      return;
    }

    // Logged in: open schedule interview screen
    Navigator.pushNamed(context, '/schedule-interview', arguments: {
      'candidateId': candidate['id'],
      'candidateName': candidate['name'],
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        title: const Text(
          "All Candidates Marketplace",
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: _searchCandidate,
              decoration: InputDecoration(
                hintText: "Search candidates...",
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _fetchCandidates(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return const Center(child: Text("Error loading candidates"));
                }
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                // Convert to list
                List<Map<String, dynamic>> candidates = snapshot.data!;

                // Apply search filter
                if (searchQuery.isNotEmpty) {
                  candidates = candidates.where((c) {
                    final name = (c['name'] ?? '').toString().toLowerCase();
                    final experience =
                        (c['experience'] ?? '').toString().toLowerCase();
                    return name.contains(searchQuery) ||
                        experience.contains(searchQuery);
                  }).toList();
                }

                if (candidates.isEmpty) {
                  return const Center(child: Text("No candidates found."));
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: candidates.length,
                  itemBuilder: (context, index) {
                    final candidate = candidates[index];

                    return CandidateCard(
                      id: candidate["id"],
                      name: candidate["name"] ?? 'Candidate',
                      age: (candidate["age"] ?? '').toString(),
                      experience: candidate["experience"] ?? '',
                      country: candidate["country"] ?? '',
                      salary: (candidate["salary"] ?? '').toString(),
                      imageUrl: candidate["image"] ??
                          "https://via.placeholder.com/150",
                      onViewDetails: () {
                        Navigator.pushNamed(
                          context,
                          '/candidate-details',
                          arguments: {'candidateId': candidate['id']},
                        );
                      },
                      onSchedule: () => _handleSchedule(context, candidate),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
