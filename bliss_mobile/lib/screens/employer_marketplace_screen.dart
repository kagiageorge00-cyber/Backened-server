import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class JobDetailsScreen extends StatelessWidget {
  final QueryDocumentSnapshot job;

  const JobDetailsScreen({super.key, required this.job});

  String _safeString(dynamic v) => v == null ? '' : v.toString();

  @override
  Widget build(BuildContext context) {
    final title = _safeString(job['jobTitle']);
    final company = _safeString(job['companyName'] ?? job['company'] ?? 'Employer');
    final logo = _safeString(job['companyLogo']);
    final category = _safeString(job['jobCategory']);
    final location = _safeString(job['location']);
    final salary = _safeString(job['salary']);
    final description = _safeString(job['description']);
    final requirements = _safeString(job['requirements']);
    final benefits = _safeString(job['benefits']);

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: true,
        foregroundColor: Colors.black87,
        title: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Company header
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 3,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: logo.isNotEmpty
                        ? Image.network(logo, width: 72, height: 72, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(width:72, height:72, color: Colors.grey.shade200, child: const Icon(Icons.business, size:36, color:Colors.grey)))
                        : Container(width:72, height:72, color: Colors.grey.shade200, child: const Icon(Icons.business, size:36, color:Colors.grey)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(company, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(6)),
                              child: Text(category, style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.w600)),
                            ),
                            const SizedBox(width: 8),
                            Text(location, style: TextStyle(color: Colors.grey.shade700)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.deepOrangeAccent),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Following company (placeholder)')));
                    },
                    child: const Text('Follow'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Job title and meta
          Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(spacing: 12, runSpacing: 8, children: [
            Chip(label: Row(children: [const Icon(Icons.location_on_outlined, size:16), const SizedBox(width:6), Text(location)])),
            Chip(label: Row(children: [const Icon(Icons.monetization_on_outlined, size:16), const SizedBox(width:6), Text(salary.isNotEmpty ? salary : 'Competitive')])),
            Chip(label: Row(children: [const Icon(Icons.work_outline, size:16), const SizedBox(width:6), Text(category.isNotEmpty ? category : 'Role')])),
          ]),
          const SizedBox(height: 18),

          // Apply CTA
          SizedBox(
            height: 54,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.deepOrangeAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              onPressed: () {
                showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  builder: (ctx) => Padding(
                    padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: const [
                          Text('Start your application', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          SizedBox(height: 8),
                          Text('To apply, you will be guided to complete your profile and upload a short introduction video.'),
                          SizedBox(height: 12),
                          SizedBox(height: 48, child: Center(child: Text('Application flow placeholder — integrate actual flow'))),
                        ],
                      ),
                    ),
                  ),
                );
              },
              child: const Text('Apply Now — Start Application', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 20),

          // Description
          const Text('About this role', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(description, style: const TextStyle(fontSize: 15, height: 1.4)),
          const SizedBox(height: 16),

          // Requirements
          const Text('Requirements', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(requirements, style: const TextStyle(fontSize: 15, height: 1.4)),
          const SizedBox(height: 16),

          // Benefits
          if (benefits.isNotEmpty) ...[
            const Text('Benefits', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(benefits, style: const TextStyle(fontSize: 15, height: 1.4)),
            const SizedBox(height: 16),
          ],

          // Company note
          Card(
            color: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            elevation: 1,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.blueAccent),
                  const SizedBox(width: 8),
                  Expanded(child: Text('This listing is managed by $company. We encourage applicants to provide accurate information and a short introductory video to increase chances of being hired.')),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

