// lib/employers_portal/screens/employer_candidates_screen.dart
import 'package:flutter/material.dart';
import '../../services/candidate_video_service.dart';
import '../widgets/candidate_card.dart';

class EmployerCandidatesScreen extends StatefulWidget {
  final String employerId;

  const EmployerCandidatesScreen({super.key, required this.employerId});

  @override
  State<EmployerCandidatesScreen> createState() =>
      _EmployerCandidatesScreenState();
}

class _EmployerCandidatesScreenState extends State<EmployerCandidatesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String searchQuery = "";

  void _searchCandidate(String query) {
    setState(() {
      searchQuery = query.toLowerCase();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Text(
          "My Candidates",
          style: TextStyle(
              color: isDarkMode ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                  )
                ],
              ),
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
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: CandidateVideoService.getApprovedCandidates().then(
                  (candidates) => candidates
                      .map((e) => Map<String, dynamic>.from(e))
                      .toList()),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: \\${snapshot.error}'));
                }
                final candidates = snapshot.data ?? [];
                // Filter by search query
                final filteredCandidates = searchQuery.isEmpty
                    ? candidates
                    : candidates.where((candidate) {
                        final name = (candidate['fullName'] ?? '')
                            .toString()
                            .toLowerCase();
                        final email =
                            (candidate['email'] ?? '').toString().toLowerCase();
                        return name.contains(searchQuery) ||
                            email.contains(searchQuery);
                      }).toList();
                if (filteredCandidates.isEmpty) {
                  return const Center(
                    child: Text(
                      'No candidates found.',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredCandidates.length,
                  itemBuilder: (context, index) {
                    final candidate = filteredCandidates[index];
                    return CandidateCard(
                      id: candidate['candidateId'] ?? '',
                      name: candidate['fullName'] ?? 'Unknown',
                      age: candidate['age']?.toString() ?? 'N/A',
                      country: candidate['country'] ?? 'Unknown',
                      experience: candidate['experience'] ?? 'N/A',
                      salary: candidate['expectedSalary']?.toString() ?? 'N/A',
                      imageUrl: candidate['photoUrl'] ?? '',
                      onViewDetails: () {
                        Navigator.pushNamed(
                          context,
                          '/candidate_details',
                          arguments: {
                            'candidateId': candidate['candidateId'],
                            'employerId': widget.employerId,
                          },
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
    );
  }
}
