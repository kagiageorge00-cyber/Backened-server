import 'package:flutter/material.dart';
import 'package:bliss_mobile/employers_portal/models/job_model.dart';
import 'package:bliss_mobile/employers_portal/service/marketplace_service.dart';

class PostDemoJobsScreen extends StatefulWidget {
  const PostDemoJobsScreen({super.key});

  @override
  State<PostDemoJobsScreen> createState() => _PostDemoJobsScreenState();
}

class _PostDemoJobsScreenState extends State<PostDemoJobsScreen> {
  final MarketplaceService _service = MarketplaceService();
  bool _posting = false;
  String _log = '';

  Future<void> _postJobs() async {
    setState(() {
      _posting = true;
      _log = '';
    });

    final employerId = 'bliss_connect';
    final employerName = 'bliss connect';
    final now = DateTime.now();

    final jobs = <Job>[
      Job(
        employerId: employerId,
        employerName: employerName,
        title: 'Housemaid — Dubai',
        description: 'Salary 1000-1200 AED\nRequirements:\n• Passport\n• Book medical (7,500)\n• Good Conduct\n• Attestation\n• Commission 50k(after visa)',
        location: 'Dubai, UAE',
        salary: 1100,
        contractType: 'Full-time',
        postedAt: now,
      ),
      Job(
        employerId: employerId,
        employerName: employerName,
        title: 'Housemaid — Qatar',
        description: 'Salary 1000-1100 QAR\nRequirements:\n• Passport\n• Good Conduct\n• Book medical (7,500)\n• Attestation\n• Commission 50k(after visa)',
        location: 'Doha, Qatar',
        salary: 1050,
        contractType: 'Full-time',
        postedAt: now,
      ),
      Job(
        employerId: employerId,
        employerName: employerName,
        title: 'Housemaid — Bahrain',
        description: 'Salary 100-110 BHD\nRequirements:\n• Passport\n• GAMCA medical 15k\n• Meningitis card 5k',
        location: 'Manama, Bahrain',
        salary: 105,
        contractType: 'Full-time',
        postedAt: now,
      ),
      Job(
        employerId: employerId,
        employerName: employerName,
        title: 'Housemaid — Oman',
        description: 'Salary 90-100 OMR\nRequirements:\n• Passport\n• GAMCA medical 15k\n• Vaccination certificate',
        location: 'Muscat, Oman',
        salary: 95,
        contractType: 'Full-time',
        postedAt: now,
      ),
      Job(
        employerId: employerId,
        employerName: employerName,
        title: 'Housemaid — Iraq',
        description: 'Salary 250-300 USD\nRequirements:\n• Passport\n• Book medical (7,500)',
        location: 'Iraq',
        salary: 275,
        contractType: 'Full-time',
        postedAt: now,
      ),
      Job(
        employerId: employerId,
        employerName: employerName,
        title: 'Housemaid — Lebanon',
        description: 'Salary 200-250 USD\nRequirements:\n• Passport\n• Book medical (7,500)',
        location: 'Lebanon',
        salary: 225,
        contractType: 'Full-time',
        postedAt: now,
      ),
    ];

    for (final job in jobs) {
      try {
        await _service.addJobToMarketplace(job);
        setState(() {
          _log += 'Posted: ${job.title}\n';
        });
      } catch (e) {
        setState(() {
          _log += 'Failed: ${job.title} — $e\n';
        });
      }
    }

    setState(() => _posting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post Demo Jobs')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('This will post demo Housemaid jobs to the marketplace using the employer "bliss connect".'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _posting ? null : _postJobs,
              child: _posting ? const CircularProgressIndicator(color: Colors.white) : const Text('Post Demo Jobs'),
            ),
            const SizedBox(height: 16),
            const Text('Log:'),
            const SizedBox(height: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                child: SingleChildScrollView(child: Text(_log.isEmpty ? 'No actions yet' : _log)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
