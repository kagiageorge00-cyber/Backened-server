import 'package:flutter/material.dart';

class VideoVoiceCallScreen extends StatelessWidget {
const VideoVoiceCallScreen({super.key});

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(
title: const Text('Video / Voice Call'),
backgroundColor: Colors.blueAccent,
),
body: Center(
child: Padding(
padding: const EdgeInsets.all(16.0),
child: Column(
mainAxisAlignment: MainAxisAlignment.center,
children: [
const Icon(Icons.videocam, size: 100, color: Colors.blueAccent),
const SizedBox(height: 20),
ElevatedButton.icon(
onPressed: _startVideoCall,
icon: const Icon(Icons.videocam),
label: const Text("Start Video Call"),
style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
),
const SizedBox(height: 16),
ElevatedButton.icon(
onPressed: _startVoiceCall,
icon: const Icon(Icons.call),
label: const Text("Start Voice Call"),
style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
),
const SizedBox(height: 16),
ElevatedButton.icon(
onPressed: () => Navigator.pop(context),
icon: const Icon(Icons.arrow_back),
label: const Text("Back"),
style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50), backgroundColor: Colors.grey),
),
],
),
),
),
);
}

void _startVideoCall() {
// Placeholder for integrating WebRTC or video call service
debugPrint("Video call initiated");
}

void _startVoiceCall() {
// Placeholder for integrating WebRTC or voice call service
debugPrint("Voice call initiated");
}
}
