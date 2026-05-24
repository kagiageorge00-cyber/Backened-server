import 'package:flutter/material.dart';
import '../constants/colors.dart';

class PrivateChatMessagesScreen extends StatefulWidget {
  final String chatId;
  final String agentId;
  const PrivateChatMessagesScreen(
      {super.key, required this.chatId, required this.agentId});

  @override
  State<PrivateChatMessagesScreen> createState() =>
      _PrivateChatMessagesScreenState();
}

class _PrivateChatMessagesScreenState extends State<PrivateChatMessagesScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        backgroundColor: AppColors.primary,
      ),
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Chat messages will be loaded from the backend server once the messaging API is available.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, fontSize: 16),
                ),
              ),
            ),
          ),
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Type a message',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 0),
                    ),
                  ),
                ),
                IconButton(
                  icon: _sending
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send, color: AppColors.primary),
                  onPressed: _sending
                      ? null
                      : () async {
                          final text = _controller.text.trim();
                          if (text.isEmpty) return;
                          setState(() => _sending = true);
                          // TODO: Replace with backend server API call to send message
                          // Example: await sendMessageToBackend(widget.chatId, text, widget.agentId);
                          _controller.clear();
                          setState(() => _sending = false);
                        },
                ),
                // Optional: Attachment button
                // IconButton(
                //   icon: const Icon(Icons.attach_file, color: AppColors.secondary),
                //   onPressed: () {},
                // ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
