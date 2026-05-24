import 'package:flutter/material.dart';
import '../models/message_model.dart';

class ChatBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;
  final String avatarUrl;
  final bool showAvatar;
  final VoidCallback? onTapImage;
  final bool showStatusTick;

  const ChatBubble({
    super.key,
    required this.message,
    required this.isMe,
    required this.avatarUrl,
    this.showAvatar = true,
    this.onTapImage,
    this.showStatusTick = true,
  });

  // -------------------------------
  // WhatsApp-style tick icons
  // -------------------------------
  Widget _buildStatusTick() {
    if (!isMe || !showStatusTick) return const SizedBox();

    if (message.read) {
      return const Icon(Icons.done_all, size: 16, color: Colors.lightBlueAccent);
    }

    if (message.delivered) {
      return const Icon(Icons.done_all, size: 16, color: Colors.white70);
    }

    if (message.sent) {
      return const Icon(Icons.done, size: 16, color: Colors.white70);
    }

    return const Icon(Icons.access_time, size: 14, color: Colors.white54);
  }

  // -------------------------------
  // Message content builder
  // -------------------------------
  Widget _buildMessageContent(BuildContext context) {
    final firstFile = message.files.isNotEmpty ? message.files.first : null;

    final bool isImage = firstFile != null &&
        (firstFile.endsWith(".jpg") ||
            firstFile.endsWith(".jpeg") ||
            firstFile.endsWith(".png") ||
            firstFile.contains("image"));

    final timestamp =
        "${message.timestamp.hour.toString().padLeft(2, '0')}:${message.timestamp.minute.toString().padLeft(2, '0')}";

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // -------------------
        // IMAGE BUBBLE (if any)
        // -------------------
        if (isImage) ...[
          GestureDetector(
            onTap: onTapImage,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image.network(
                firstFile,
                width: 220,
                height: 160,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],

        // -------------------
        // TEXT MESSAGE
        // -------------------
        if (message.message.isNotEmpty)
          Text(
            message.message,
            style: TextStyle(
              color: isMe ? Colors.white : Colors.black87,
              fontSize: 15,
            ),
          ),

        const SizedBox(height: 6),

        // -------------------
        // TIMESTAMP + TICK
        // -------------------
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              timestamp,
              style: TextStyle(
                fontSize: 11,
                color: isMe ? Colors.white70 : Colors.black54,
              ),
            ),
            if (isMe) ...[
              const SizedBox(width: 4),
              _buildStatusTick(),
            ],
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final bubbleColor = isMe ? Colors.blueAccent : Colors.grey[200];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          // -------------------
          // OTHER USER AVATAR
          // -------------------
          if (!isMe && showAvatar)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: Colors.grey.shade400,
                backgroundImage:
                    avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                child: avatarUrl.isEmpty
                    ? const Icon(Icons.person, color: Colors.white)
                    : null,
              ),
            ),

          // -------------------
          // CHAT BUBBLE
          // -------------------
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: bubbleColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 16),
                ),
              ),
              child: _buildMessageContent(context),
            ),
          ),

          if (isMe) const SizedBox(width: 8),
        ],
      ),
    );
  }
}
