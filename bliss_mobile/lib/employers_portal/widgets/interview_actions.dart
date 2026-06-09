import 'package:flutter/material.dart';
import '../services/interview_api_client.dart';

class InterviewActions extends StatefulWidget {
  final String interviewId;
  final String candidateId;

  const InterviewActions(
      {super.key, required this.interviewId, required this.candidateId});

  @override
  State<InterviewActions> createState() => _InterviewActionsState();
}

class _InterviewActionsState extends State<InterviewActions> {
  bool _loading = false;

  Future<void> _respond(String response) async {
    setState(() => _loading = true);
    final res = await InterviewApiClient.respondInterview(
      interviewId: widget.interviewId,
      candidateId: widget.candidateId,
      response: response,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(res['success'] == true
              ? 'Response sent'
              : 'Failed: ${res['error']}')),
    );
  }

  Future<void> _createMeeting() async {
    setState(() => _loading = true);
    final res = await InterviewApiClient.createMeeting(widget.interviewId);
    if (!mounted) return;
    setState(() => _loading = false);
    if (res['success'] == true && res['meetingLink'] != null) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Meeting Link'),
          content: Text(res['meetingLink']),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close')),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create meeting: ${res['error']}')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ElevatedButton(
          onPressed: _loading ? null : () => _respond('accepted'),
          child: const Text('Accept'),
        ),
        const SizedBox(width: 8),
        OutlinedButton(
          onPressed: _loading ? null : () => _respond('declined'),
          child: const Text('Decline'),
        ),
        const SizedBox(width: 12),
        IconButton(
          onPressed: _loading ? null : _createMeeting,
          icon: const Icon(Icons.video_call),
        ),
      ],
    );
  }
}
