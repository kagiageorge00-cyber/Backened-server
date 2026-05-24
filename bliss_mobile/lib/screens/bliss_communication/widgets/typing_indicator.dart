import 'package:flutter/material.dart';

class TypingIndicator extends StatelessWidget {
  const TypingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(width: 6),
        const SizedBox(width: 8, height: 8, child: CircularProgressIndicator(strokeWidth: 2)),
        const SizedBox(width: 6),
        Text('Typing...', style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[400] : Colors.black54)),
      ],
    );
  }
}
