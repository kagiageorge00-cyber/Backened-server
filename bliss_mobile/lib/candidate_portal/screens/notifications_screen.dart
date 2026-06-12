import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/candidate_service.dart';

class NotificationsScreen extends StatefulWidget {
  final ApiClient api;
  const NotificationsScreen({super.key, required this.api});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _notifications;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _notifications = _service.getNotifications();
  }

  Future<void> _refresh() async {
    setState(() {
      _notifications = _service.getNotifications();
    });
    await _notifications;
  }

  Future<void> _markAllRead(List<Map<String, dynamic>> items) async {
    final ids = items
        .map((item) => item['notificationId']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList();
    final success = await _service.markNotificationsRead(ids);
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notifications marked read')));
      await _refresh();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to update notifications')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _notifications,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final items = snapshot.data ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Expanded(
                      child: Text('Notifications',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold))),
                  if (items.isNotEmpty)
                    TextButton(
                        onPressed: () => _markAllRead(items),
                        child: const Text('Mark all read')),
                ],
              ),
            ),
            Expanded(
              child: items.isEmpty
                  ? const Center(child: Text('No notifications yet.'))
                  : RefreshIndicator(
                      onRefresh: _refresh,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          final item = items[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Text(
                                  item['title']?.toString() ?? 'Notification'),
                              subtitle: Text(item['message']?.toString() ?? ''),
                              trailing: Icon(
                                item['isRead'] == true
                                    ? Icons.mark_email_read
                                    : Icons.mark_email_unread,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }
}
