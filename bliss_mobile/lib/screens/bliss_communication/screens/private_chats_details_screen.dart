import 'dart:io';
import 'package:flutter/material.dart';
import '../../../services/backend_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/message_model.dart';
import '../services/bliss_communication_service.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/message_input_box.dart';
import '../widgets/typing_indicator.dart';

class PrivateChatDetailsScreen extends StatefulWidget {
  final String chatId;
  final String otherUserId;
  final String otherUserName;
  final String otherUserAvatar;

  const PrivateChatDetailsScreen({
    super.key,
    required this.chatId,
    required this.otherUserId,
    required this.otherUserName,
    required this.otherUserAvatar,
  });

  @override
  State<PrivateChatDetailsScreen> createState() =>
      _PrivateChatDetailsScreenState();
}

class _PrivateChatDetailsScreenState extends State<PrivateChatDetailsScreen> {
  final BlissCommunicationService _service = BlissCommunicationService();
  final String currentUserId = BackendAuth.userId ?? '';
  final String currentUserRole = 'candidate'; // update if you fetch roles

  bool _attachmentsAllowed = false;
  bool _otherTyping = false;

  @override
  void initState() {
    super.initState();
    _listenAttachmentPermission();
    _listenTyping();
  }

  /// STREAM attachment payment status instead of one-time load
  void _listenAttachmentPermission() {
    FirebaseFirestore.instance
        .collection('bliss_private_chats')
        .doc(widget.chatId)
        .snapshots()
        .listen((doc) {
      if (doc.exists) {
        final data = doc.data()!;
        final paid = data['paidByEmployer'] == true;

        if (mounted) {
          setState(() => _attachmentsAllowed = paid);
        }
      }
    });
  }

  /// Listen to typing status: `/private_chats/<chatId>/typing/<otherUserId>`
  void _listenTyping() {
    FirebaseFirestore.instance
        .collection('private_chats_typing')
        .doc(widget.chatId)
        .collection('typing')
        .doc(widget.otherUserId)
        .snapshots()
        .listen((snap) {
      if (!mounted) return;
      if (!snap.exists) {
        setState(() => _otherTyping = false);
        return;
      }

      final typing = snap.data()?['typing'] == true;
      setState(() => _otherTyping = typing);
    });
  }

  Future<void> _sendText(String text) async {
    final msg = MessageModel(
      id: '',
      message: text,
      senderId: currentUserId,
      senderRole: currentUserRole,
      recipientId: widget.otherUserId,
      timestamp: DateTime.now(),
      files: [],
      sent: true, // NEW
      delivered: false, // NEW
      read: false, // NEW
    );

    await _service.sendPrivateMessage(widget.chatId, msg);

    await _service.sendPrivateMessage(widget.chatId, msg);
  }

  Future<void> _sendImage(File f) async {
    await _service.sendPrivateImageFile(
      fromUserId: currentUserId,
      fromUserRole: currentUserRole,
      toUserId: widget.otherUserId,
      imageFile: f,
      messageText: '',
    );
  }

  Future<void> _sendFile(File f) async {
    await _service.sendPrivateFile(
      fromUserId: currentUserId,
      fromUserRole: currentUserRole,
      toUserId: widget.otherUserId,
      file: f,
      messageText: '',
    );
  }

  Widget _buildDateSeparator(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final msgDay = DateTime(dt.year, dt.month, dt.day);
    final diff = today.difference(msgDay).inDays;

    final text = diff == 0
        ? "Today"
        : diff == 1
            ? "Yesterday"
            : "${dt.year}-${dt.month}-${dt.day}";

    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey.shade300,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          CircleAvatar(
            radius: 20,
            backgroundImage: widget.otherUserAvatar.isNotEmpty
                ? NetworkImage(widget.otherUserAvatar)
                : null,
            backgroundColor: Colors.grey.shade400,
            child: widget.otherUserAvatar.isEmpty
                ? const Icon(Icons.person)
                : null,
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              widget.otherUserName,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              "Online", // replace when you add real presence
              style: TextStyle(fontSize: 12, color: Colors.green.shade400),
            ),
          ])
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Video call not implemented"),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<List<MessageModel>>(
              stream: _service.privateMessagesStream(widget.chatId),
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final messages = snap.data ?? [];
                if (messages.isEmpty) {
                  return const Center(child: Text("No messages yet"));
                }

                // Group messages by yyyy-mm-dd
                final Map<String, List<MessageModel>> grouped = {};
                for (var m in messages) {
                  final key =
                      "${m.timestamp.year}-${m.timestamp.month}-${m.timestamp.day}";
                  grouped.putIfAbsent(key, () => []).add(m);
                }

                final keys = grouped.keys.toList()
                  ..sort((a, b) => a.compareTo(b));

                return ListView.builder(
                  reverse: true,
                  padding: const EdgeInsets.all(12),
                  itemCount: keys.length,
                  itemBuilder: (context, i) {
                    final key = keys[keys.length - 1 - i];
                    final dayMessages = grouped[key]!;

                    return Column(
                      children: [
                        _buildDateSeparator(dayMessages.first.timestamp),
                        ...dayMessages.reversed.map((m) {
                          final isMe = m.senderId == currentUserId;

                          return ChatBubble(
                            message: m,
                            isMe: isMe,
                            avatarUrl: widget.otherUserAvatar,
                            showAvatar: !isMe,
                            showStatusTick: true,
                            onTapImage: () {
                              if (m.files.isNotEmpty) {
                                showDialog(
                                  context: context,
                                  builder: (_) => Dialog(
                                    child: InteractiveViewer(
                                      child: Image.network(m.files.first),
                                    ),
                                  ),
                                );
                              }
                            },
                          );
                        }),
                      ],
                    );
                  },
                );
              },
            ),
          ),
          if (_otherTyping)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: TypingIndicator(),
            ),
          MessageInputBox(
            chatId: widget.chatId,
            otherUserId: widget.otherUserId,
            attachmentsAllowed: _attachmentsAllowed,
            service: _service,
            onSendText: _sendText,
            onPickImage: _sendImage,
            onPickFile: _sendFile,
          ),
        ],
      ),
    );
  }
}
