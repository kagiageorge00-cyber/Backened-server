import 'package:flutter/material.dart';
import '../services/backend_service.dart';

class BackendMonitorScreen extends StatefulWidget {
  const BackendMonitorScreen({super.key});

  @override
  State<BackendMonitorScreen> createState() => _BackendMonitorScreenState();
}

class _BackendMonitorScreenState extends State<BackendMonitorScreen> {
  Map<String, dynamic> _status = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    setState(() => _loading = true);
    try {
      final status = await BackendService.getServiceStatus();
      setState(() => _status = status);
    } catch (e) {
      setState(() => _status = {'error': e.toString()});
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _postDemoJobs() async {
    final success = await BackendService.postDemoJobs();
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Demo jobs posted successfully!')),
      );
      _loadStatus(); // Refresh stats
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to post demo jobs')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Backend Monitor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStatus,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Health Status
                  _buildStatusCard(
                    'System Health',
                    _status['health']?['status'] == 'healthy' ? '🟢 Online' : '🔴 Offline',
                    _status['health'] ?? {},
                  ),

                  const SizedBox(height: 16),

                  // Statistics
                  _buildStatusCard(
                    'Business Stats',
                    '📊 Current Metrics',
                    _status['stats'] ?? {},
                  ),

                  const SizedBox(height: 16),

                  // Automated Services
                  _buildStatusCard(
                    'Automated Services',
                    '🤖 Running 24/7',
                    _status['automated_services'] ?? {},
                  ),

                  const SizedBox(height: 24),

                  // Manual Controls
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Manual Controls',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _postDemoJobs,
                            icon: const Icon(Icons.work),
                            label: const Text('Post Demo Jobs Now'),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 48),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Info
                  Card(
                    color: Colors.blue.shade50,
                    child: const Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '💡 About Automation',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Your recruitment business now runs 24/7 automatically:\n\n'
                            '• Posts fresh jobs every 6 hours\n'
                            '• Processes payments automatically\n'
                            '• Sends WhatsApp reminders daily\n'
                            '• Collects revenue continuously\n\n'
                            'No manual intervention required!',
                            style: TextStyle(height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatusCard(String title, String subtitle, Map<String, dynamic> data) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 12),
            if (data.isNotEmpty && !data.containsKey('error'))
              ..._buildDataRows(data)
            else if (data.containsKey('error'))
              Text(
                'Error: ${data['error']}',
                style: const TextStyle(color: Colors.red),
              )
            else
              const Text('No data available'),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildDataRows(Map<String, dynamic> data) {
    return data.entries.map((entry) {
      if (entry.value is Map) return const SizedBox.shrink();

      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              _formatKey(entry.key),
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            Text(
              entry.value.toString(),
              style: const TextStyle(
                color: Colors.blue,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  String _formatKey(String key) {
    return key.replaceAllMapped(
      RegExp(r'([A-Z])'),
      (match) => ' ${match.group(1)!.toLowerCase()}',
    ).trim().replaceFirst(key[0], key[0].toUpperCase());
  }
}