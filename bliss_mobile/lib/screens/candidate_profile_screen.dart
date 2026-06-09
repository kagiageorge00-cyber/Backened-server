import 'package:flutter/material.dart';

class CandidateProfileScreen extends StatelessWidget {
  final Map<String, dynamic> data;
  const CandidateProfileScreen({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final name = data['fullName'] ?? 'No Name';
    final photo = data['photoUrl'] ?? '';
    final skills = (data['skills'] ?? '').toString().split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Candidate Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: photo.isNotEmpty
                    ? Image.network(photo, width: 220, height: 220, fit: BoxFit.cover)
                    : const SizedBox(width: 220, height: 220, child: Icon(Icons.person, size: 96)),
              ),
            ),
            const SizedBox(height: 12),
            Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(data['candidateId'] ?? '', style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Row(children: [
              if ((data['availability'] ?? '').toString().isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(8)),
                  child: Text(data['availability'] ?? 'Available', style: const TextStyle(color: Colors.green)),
                ),
              const SizedBox(width: 12),
              Text('Registered: ${data['registrationDate'] ?? data['createdAt'] ?? '-'}', style: TextStyle(color: Colors.grey[700])),
            ]),
            const SizedBox(height: 16),
            const Text('Skills', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: skills.map((s) => Chip(label: Text(s))).toList()),
            const SizedBox(height: 16),
            const Text('Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if ((data['resumeUrl'] ?? '').toString().isNotEmpty) Text('• CV available'),
              if ((data['passportUrl'] ?? '').toString().isNotEmpty) Text('• Passport available'),
            ]),
            const SizedBox(height: 16),
            const Text('Overview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(data['summary'] ?? data['about'] ?? 'No summary provided'),
          ],
        ),
      ),
    );
  }
}
