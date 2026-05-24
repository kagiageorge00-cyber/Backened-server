import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/bliss_communication_service.dart';

typedef OnSendText = Future<void> Function(String text);
typedef OnPickImage = Future<void> Function(File file);
typedef OnPickFile = Future<void> Function(File file);

class MessageInputBox extends StatefulWidget {
  final String chatId;
  final String otherUserId;
  final bool attachmentsAllowed; // gate for pictures/files
  final OnSendText onSendText;
  final OnPickImage onPickImage;
  final OnPickFile onPickFile;
  final BlissCommunicationService service;

  const MessageInputBox({
    super.key,
    required this.chatId,
    required this.otherUserId,
    required this.attachmentsAllowed,
    required this.onSendText,
    required this.onPickImage,
    required this.onPickFile,
    required this.service,
  });

  @override
  State<MessageInputBox> createState() => _MessageInputBoxState();
}

class _MessageInputBoxState extends State<MessageInputBox> {
  final TextEditingController _controller = TextEditingController();
  final picker = ImagePicker();
  bool _isSending = false;

  Future<void> _sendText() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() => _isSending = true);

    try {
      await widget.onSendText(text);
      _controller.clear();
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _pickImage() async {
    if (!widget.attachmentsAllowed) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Attachments are locked.')));
      return;
    }
    final XFile? f = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (f == null) return;
    await widget.onPickImage(File(f.path));
  }

  Future<void> _pickFile() async {
    if (!widget.attachmentsAllowed) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Attachments are locked.')));
      return;
    }
    // simple file pick - using image picker for demo; for other file types use file_picker plugin
    final XFile? f = await picker.pickImage(source: ImageSource.gallery);
    if (f == null) return;
    await widget.onPickFile(File(f.path));
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          children: [
            IconButton(onPressed: _pickImage, icon: const Icon(Icons.image)),
            IconButton(onPressed: _pickFile, icon: const Icon(Icons.attach_file)),
            Expanded(
              child: TextField(
                controller: _controller,
                decoration: InputDecoration(
                  hintText: 'Type a message',
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendText(),
              ),
            ),
            IconButton(
              onPressed: _isSending ? null : _sendText,
              icon: const Icon(Icons.send, color: Colors.blueAccent),
            ),
          ],
        ),
      ),
    );
  }
}
