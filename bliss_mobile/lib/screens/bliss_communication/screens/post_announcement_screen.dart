import 'package:bliss_mobile/firebase_stub.dart';
import 'package:flutter/material.dart';

class PostAnnouncementScreen extends StatefulWidget {
  const PostAnnouncementScreen({super.key});

  @override
  State<PostAnnouncementScreen> createState() => _PostAnnouncementScreenState();
}

class _PostAnnouncementScreenState extends State<PostAnnouncementScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  final List<String> _attachments = [];

  bool isPosting = false;

  final List<String> audiences = [
    "all",
    "employers",
    "agents",
    "candidates",
    "staff"
  ];

  String selectedAudience = "all";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Post Announcement"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Title", style: TextStyle(fontWeight: FontWeight.bold)),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(hintText: "Enter title"),
            ),
            const SizedBox(height: 15),
            const Text("Message",
                style: TextStyle(fontWeight: FontWeight.bold)),
            TextField(
              controller: _messageController,
              maxLines: 5,
              decoration: const InputDecoration(hintText: "Enter message"),
            ),
            const SizedBox(height: 15),
            const Text("Target Audience",
                style: TextStyle(fontWeight: FontWeight.bold)),
            DropdownButton<String>(
              value: selectedAudience,
              isExpanded: true,
              items: audiences.map((a) {
                return DropdownMenuItem<String>(
                  value: a,
                  child: Text(a.toUpperCase()),
                );
              }).toList(),
              onChanged: (v) {
                setState(() {
                  selectedAudience = v!;
                });
              },
            ),
            const SizedBox(height: 20),
            const Text("Attachments (optional)",
                style: TextStyle(fontWeight: FontWeight.bold)),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (var file in _attachments)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 5),
                    child: Text("• $file",
                        style: const TextStyle(color: Colors.blue)),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: () async {
                await _addAttachment();
              },
              icon: const Icon(Icons.attach_file),
              label: const Text("Add Attachment (URL)"),
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isPosting ? null : _postAnnouncement,
                child: isPosting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("Post Announcement"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addAttachment() async {
    TextEditingController urlController = TextEditingController();

    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text("Add Attachment URL"),
          content: TextField(
            controller: urlController,
            decoration: const InputDecoration(hintText: "Enter file/image URL"),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
              },
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                if (urlController.text.isNotEmpty) {
                  setState(() {
                    _attachments.add(urlController.text.trim());
                  });
                }
                Navigator.pop(ctx);
              },
              child: const Text("Add"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _postAnnouncement() async {
    if (_titleController.text.trim().isEmpty ||
        _messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text("All fields required")));
      return;
    }

    setState(() {
      isPosting = true;
    });

    final data = {
      "title": _titleController.text.trim(),
      "message": _messageController.text.trim(),
      "createdBy": "admin", // TODO: Replace with your logged-in user's ID
      "targetAudience": selectedAudience,
      "attachments": _attachments,
      "timestamp": Timestamp.now(),
    };

    await FirebaseFirestore.instance
        .collection("bliss_announcements")
        .add(data);

    setState(() {
      isPosting = false;
    });

    Navigator.pop(context);
  }
}
