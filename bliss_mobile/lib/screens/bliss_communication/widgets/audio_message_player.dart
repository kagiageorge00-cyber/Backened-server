import 'package:flutter/material.dart';

class AudioMessagePlayer extends StatelessWidget {
  final String audioUrl;

  const AudioMessagePlayer({super.key, required this.audioUrl});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.play_circle, size: 30),
        SizedBox(width: 8),
        Text("Voice Message"),
      ],
    );
  }
}
