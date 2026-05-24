import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class StaffApplicantsScreen extends StatelessWidget {
  const StaffApplicantsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final applicants = List.generate(12, (i) => 'Candidate ${i + 1}');

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Applicants'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: GridView.builder(
          itemCount: applicants.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 3 / 2, crossAxisSpacing: 12, mainAxisSpacing: 12),
          itemBuilder: (context, idx) {
            return InkWell(
              onTap: () => Navigator.pushNamed(context, '/staff/applicantDetail', arguments: {'applicantId': 'candidate_${idx+1}'}),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(radius: 18, backgroundColor: Colors.teal[50], child: Text('${idx + 1}')),
                    const SizedBox(height: 8),
                    Text(applicants[idx], style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('Profile in review', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}