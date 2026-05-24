import 'package:flutter/material.dart';
import 'video_call_screen.dart';

class CandidatePortalScreen extends StatefulWidget {
  const CandidatePortalScreen({super.key});

  @override
  _CandidatePortalScreenState createState() => _CandidatePortalScreenState();
}

class _CandidatePortalScreenState extends State<CandidatePortalScreen> {
  // ...existing code...

  void _startVideoCall(String employerId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoCallScreen(
          channelName: 'interview_$employerId',
          token: 'YOUR_AGORA_TOKEN', // Replace with actual token
        ),
      ),
    );
  }

  // ...existing code...

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Candidate Portal')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => _startVideoCall('employer123'), // Example employer ID
          child: Text('Start Video Call'),
        ),
      ),
    );
  }
}