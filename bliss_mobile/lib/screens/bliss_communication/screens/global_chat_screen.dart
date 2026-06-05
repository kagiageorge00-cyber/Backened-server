import 'package:flutter/material.dart';
import 'package:bliss_mobile/firebase_stub.dart';
import '../services/bliss_communication_service.dart';
import '../models/message_model.dart';

class GlobalChatScreen extends StatefulWidget {
  final String userId;
  final String role;

  const GlobalChatScreen({
    super.key,
    required this.userId,
    required this.role,
  });

  @override
  State<GlobalChatScreen> createState() => _GlobalChatScreenState();
}

class _GlobalChatScreenState extends State<GlobalChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final BlissCommunicationService service = BlissCommunicationService();

  bool _isTyping = false;
  bool _otherTyping = false;

  @override
  void initState() {
    super.initState();

    // Listen to typing status from others
    service.listenGlobalTyping(widget.userId).listen((typing) {
      if (mounted) {
        setState(() => _otherTyping = typing);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  bool _containsForbiddenInfo(String text) {
    final phoneRegex = RegExp(r'\b\d{8,15}\b');
    final emailRegex = RegExp(r'\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b');
    return phoneRegex.hasMatch(text) || emailRegex.hasMatch(text);
  }

  // ----------------------------------------------------
  // SEND MESSAGE — FULLY FIXED
  // ----------------------------------------------------
  void _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    if (_containsForbiddenInfo(text)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Sharing phone numbers or emails is not allowed!"),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Create auto-ID doc
    final docRef =
        FirebaseFirestore.instance.collection("bliss_global_chat").doc();

    final message = MessageModel(
      id: docRef.id,
      message: text,
      senderId: widget.userId,
      senderRole: widget.role,
      recipientId: null,
      timestamp: DateTime.now(),
      files: [],
      sent: true,
      delivered: false,
      read: false,
    );

    await docRef.set(message.toMap());

    _controller.clear();
    _scrollToBottom();
    _updateTyping(false);
  }

  void _updateTyping(bool typing) {
    if (_isTyping != typing) {
      _isTyping = typing;
      service.updateGlobalTypingStatus(widget.userId, typing);
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 120), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0.0,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ----------------------------------------------------
  // MESSAGE WIDGET — WITH WHATSAPP TICKS
  // ----------------------------------------------------
  Widget _buildMessage(MessageModel msg) {
    final bool isMe = msg.senderId == widget.userId;

    Icon tickIcon;
    if (!isMe) {
      tickIcon = const Icon(Icons.done, size: 14, color: Colors.transparent);
    } else if (msg.read) {
      tickIcon = const Icon(Icons.done_all,
          size: 16, color: Colors.lightBlueAccent); // Blue ✓✓
    } else if (msg.delivered) {
      tickIcon = const Icon(Icons.done_all,
          size: 16, color: Colors.white70); // Grey ✓✓
    } else {
      tickIcon = const Icon(Icons.done,
          size: 14, color: Colors.white70); // Single grey ✓
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isMe ? Colors.blueAccent : Colors.grey.shade300,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              msg.message,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  msg.senderRole,
                  style: TextStyle(
                    fontSize: 10,
                    color: isMe ? Colors.white70 : Colors.black54,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _formatTimestamp(msg.timestamp),
                  style: TextStyle(
                    fontSize: 10,
                    color: isMe ? Colors.white70 : Colors.black54,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  tickIcon,
                ]
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime ts) {
    return "${ts.hour.toString().padLeft(2, '0')}:${ts.minute.toString().padLeft(2, '0')}";
  }

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Global Chat"),
        backgroundColor: Colors.blue.shade700,
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<List<MessageModel>>(
              stream: service.globalMessagesStream(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final messages = snapshot.data!;
                if (messages.isEmpty) {
                  return const Center(child: Text("No messages yet"));
                }

                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    return _buildMessage(messages[index]);
                  },
                );
              },
            ),
          ),
          if (_otherTyping)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Row(
                children: const [
                  SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2)),
                  SizedBox(width: 6),
                  Text("Someone is typing..."),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: "Type your message...",
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      contentPadding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(28),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (val) {
                      _updateTyping(val.isNotEmpty);
                    },
                  ),
                ),
                const SizedBox(width: 6),
                CircleAvatar(
                  radius: 23,
                  backgroundColor: Colors.blueAccent,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
