import 'package:flutter/material.dart';
import '../services/candidate_service.dart';
import '../services/api_client.dart';

class ApplicationsScreen extends StatefulWidget {
  final ApiClient api;
  final String? candidateId;
  const ApplicationsScreen({super.key, required this.api, this.candidateId});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _applications;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _applications =
        _service.getApplications(candidateId: widget.candidateId, full: true);
  }

  String _formatDate(dynamic dateValue) {
    if (dateValue == null) return '-';
    try {
      if (dateValue is String) {
        final parsed = DateTime.parse(dateValue);
        return '${parsed.day}/${parsed.month}/${parsed.year}';
      }
    } catch (_) {}
    return dateValue.toString();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'waiting for employer':
        return Colors.orange;
      case 'submitted':
      case 'pending':
        return Colors.orange;
      case 'accepted':
      case 'approved':
        return Colors.green;
      case 'rejected':
      case 'declined':
        return Colors.red;
      case 'shortlisted':
        return Colors.blue;
      case 'interviewed':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  // Stages displayed in the UI progress tracker
  final List<String> _stages = [
    'Submitted',
    'Under Review',
    'Waiting For Employer',
    'Waiting For Interview',
    'Interview Scheduled',
    'Deployment Started',
    'Visa',
    'Ticket',
    'Travel',
    'Contract Active',
    'Deployed',
  ];

  int _determineStageIndex(Map<String, dynamic> app) {
    final status = (app['applicationStatus'] ?? app['status'] ?? '')
        .toString()
        .toLowerCase();
    // Attempt to read nested candidate/applicant data for more signals
    final dynamic candidateRaw =
        app['candidate'] ?? app['applicant'] ?? app['user'] ?? app;
    Map<String, dynamic> candidate;
    if (candidateRaw is Map<String, dynamic>) {
      candidate = candidateRaw;
    } else if (candidateRaw is Map) {
      try {
        candidate = Map<String, dynamic>.from(candidateRaw);
      } catch (_) {
        candidate = <String, dynamic>{};
      }
    } else {
      candidate = <String, dynamic>{};
    }
    if (status.contains('deployed')) return _stages.indexOf('Deployed');
    if (app['deploymentId'] != null || app['deployment'] != null) {
      return _stages.indexOf('Deployment Started');
    }
    if (status.contains('passed') || status.contains('deployment')) {
      return _stages.indexOf('Deployment Started');
    }
    if (status.contains('scheduled') ||
        status.contains('interview scheduled')) {
      return _stages.indexOf('Interview Scheduled');
    }
    if (status.contains('interview') || status.contains('requested')) {
      return _stages.indexOf('Waiting For Interview');
    }
    // Detect explicit 'waiting for employer' statuses and variants
    if (status.contains('waiting for employer') ||
        status.contains('waiting_for_employer') ||
        (status.contains('waiting') && status.contains('employer')) ||
        status.contains('waiting for employer response') ||
        status.contains('waiting for employer action')) {
      return _stages.indexOf('Waiting For Employer');
    }
    if (status.contains('shortlist') || status.contains('shortlisted')) {
      return _stages.indexOf('Waiting For Employer');
    }
    // If candidate is already published/listed on the employer marketplace
    final marketplaceSignals = [
      'marketplace',
      'published',
      'publishedToMarketplace',
      'marketplaceListing',
      'marketplaceId',
      'listed',
      'isListed',
      'isOnMarketplace',
      'onMarketplace',
      'employerMarketplace'
    ];

    for (final key in marketplaceSignals) {
      final v = candidate[key];
      if (v == true) return _stages.indexOf('Waiting For Employer');
      if (v is String && v.trim().isNotEmpty)
        return _stages.indexOf('Waiting For Employer');
    }

    // Check for later deployment flow signals (visa, ticket, contract)
    final visa = (candidate['visaStatus'] ?? candidate['visa'] ?? '')
        .toString()
        .toLowerCase();
    final ticket = (candidate['ticketStatus'] ?? candidate['ticket'] ?? '')
        .toString()
        .toLowerCase();
    final contract =
        (candidate['contractStatus'] ?? candidate['contract'] ?? '')
            .toString()
            .toLowerCase();

    if (contract.contains('active') ||
        contract.contains('signed') ||
        contract.contains('contract')) {
      return _stages.indexOf('Contract Active');
    }
    if (ticket.contains('issued') || ticket.contains('ticket')) {
      return _stages.indexOf('Ticket');
    }
    if (visa.contains('approved') ||
        visa.contains('issued') ||
        visa.contains('visa')) {
      return _stages.indexOf('Visa');
    }
    if (status.contains('under review')) return _stages.indexOf('Under Review');
    final submittedIdx = _stages.indexOf('Submitted');
    return submittedIdx >= 0 ? submittedIdx : 0;
  }

  Widget _buildProgressTracker(Map<String, dynamic> app) {
    final idx = _determineStageIndex(app);
    final currentStage = _stages[idx];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(currentStage),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  currentStage,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(_stages.length, (i) {
              final done = i < idx;
              final active = i == idx;
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: Column(
                  children: [
                    Container(
                      padding: EdgeInsets.all(active ? 8.0 : 6.0),
                      decoration: BoxDecoration(
                        color: done
                            ? Colors.green
                            : active
                                ? _getStatusColor(currentStage)
                                : Colors.grey.shade300,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        done
                            ? Icons.check
                            : (active ? Icons.adjust : Icons.circle),
                        size: active ? 14.0 : 12.0,
                        color: done || active
                            ? Colors.white
                            : Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: 90,
                      child: Text(
                        _stages[i],
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          color: done || active
                              ? Colors.black87
                              : Colors.grey[600],
                          fontWeight: active
                              ? FontWeight.w800
                              : (done ? FontWeight.w600 : FontWeight.normal),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _applications,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final apps = snapshot.data ?? [];
        if (apps.isEmpty) {
          return const Center(
            child: Text(
              'No applications found yet. Check the auth token and backend response in console.',
              textAlign: TextAlign.center,
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: apps.length,
          itemBuilder: (context, index) {
            final app = apps[index];
            final idx = _determineStageIndex(app);
            final inferredStage = _stages[idx];
            final fullName =
                app['fullName']?.toString() ?? app['name']?.toString() ?? '-';
            final position = app['position']?.toString() ??
                app['jobTitle']?.toString() ??
                app['job']?['title']?.toString() ??
                '-';
            final country = app['country']?.toString() ?? '-';
            final jobType = app['jobType']?.toString() ?? '-';
            final applicationDate =
                _formatDate(app['applicationDate'] ?? app['createdAt']);

            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              elevation: 3,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header: Position and Status
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            position,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _getStatusColor(inferredStage),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            inferredStage.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(),
                    const SizedBox(height: 12),
                    // Application details in grid
                    Column(
                      children: [
                        _buildDetailRow('Name', fullName),
                        _buildDetailRow(
                            'Email', app['email']?.toString() ?? '-'),
                        _buildDetailRow(
                            'Phone', app['phone']?.toString() ?? '-'),
                        _buildDetailRow('Country', country),
                        _buildDetailRow('Nationality',
                            app['nationality']?.toString() ?? '-'),
                        _buildDetailRow('Job Type', jobType),
                        if (app['experience'] != null)
                          _buildDetailRow('Experience',
                              '${app['experience']?.toString() ?? '-'} years'),
                        if (app['educationalLevel'] != null)
                          _buildDetailRow('Education',
                              app['educationalLevel']?.toString() ?? '-'),
                        if (app['maritalStatus'] != null)
                          _buildDetailRow('Marital Status',
                              app['maritalStatus']?.toString() ?? '-'),
                        if (app['religion'] != null)
                          _buildDetailRow(
                              'Religion', app['religion']?.toString() ?? '-'),
                        if (app['noOfChildren'] != null)
                          _buildDetailRow('Children',
                              app['noOfChildren']?.toString() ?? '-'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Skills
                    if (app['skills'] is List &&
                        (app['skills'] as List).isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Skills',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children:
                                (app['skills'] as List).map<Widget>((skill) {
                              return Chip(
                                label: Text(skill.toString()),
                                backgroundColor: Colors.blue.shade100,
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    // Progress tracker
                    const SizedBox(height: 12),
                    _buildProgressTracker(app),
                    const SizedBox(height: 12),
                    // Footer: Application Date
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Applied on: $applicationDate',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (app['_id'] != null)
                          TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Application ID: ${app['_id'].toString()}',
                                  ),
                                ),
                              );
                            },
                            child: const Text('View ID'),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
