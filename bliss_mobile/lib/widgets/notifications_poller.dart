import 'dart:async';
import 'package:flutter/material.dart';
import '../services/notifications_service.dart';

class NotificationsPoller extends StatefulWidget {
  final String userType;
  final String userId;

  const NotificationsPoller(
      {super.key, required this.userType, required this.userId});

  @override
  State<NotificationsPoller> createState() => _NotificationsPollerState();
}

class _NotificationsPollerState extends State<NotificationsPoller> {
  Timer? _timer;
  List<Map<String, dynamic>> _notes = [];

  @override
  void initState() {
    super.initState();
    _fetch();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) => _fetch());
  }

  Future<void> _fetch() async {
    final list = await NotificationsService.fetchNotifications(
        userType: widget.userType, userId: widget.userId);
    if (!mounted) return;
    setState(() => _notes = list);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Icon(Icons.notifications),
        if (_notes.isNotEmpty)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration:
                  BoxDecoration(color: Colors.red, shape: BoxShape.circle),
              child: Text('${_notes.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 10)),
            ),
          )
      ],
    );
  }
}
