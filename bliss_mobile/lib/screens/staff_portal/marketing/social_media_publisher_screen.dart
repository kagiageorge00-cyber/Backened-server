import 'package:flutter/material.dart';

class SocialMediaPublisherScreen extends StatefulWidget {
  const SocialMediaPublisherScreen({super.key});

  @override
  State<SocialMediaPublisherScreen> createState() => _SocialMediaPublisherScreenState();
}

class _SocialMediaPublisherScreenState extends State<SocialMediaPublisherScreen> {
  final TextEditingController postController = TextEditingController();
  bool isPosting = false;

  // Toggle switches for platforms
  bool postToFacebook = true;
  bool postToInstagram = true;
  bool postToTikTok = false;
  bool postToTwitter = false;
  bool postToLinkedIn = false;

  // Scheduling
  bool isScheduled = false;
  DateTime? scheduledDate;

  String? attachedMedia; // Image or video fake URL

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Social Media Publisher"),
        backgroundColor: Colors.deepPurple,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const Text(
              "Create Post",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 12),

            TextField(
              controller: postController,
              maxLines: 6,
              decoration: const InputDecoration(
                hintText: "Write your content here…",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: _selectMedia,
                  icon: const Icon(Icons.upload_file),
                  label: const Text("Upload Image / Video"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                  ),
                ),
                const SizedBox(width: 15),
                if (attachedMedia != null)
                  const Icon(Icons.check_circle, color: Colors.green, size: 28),
              ],
            ),

            const SizedBox(height: 25),
            const Text(
              "Post To:",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            _platformToggle("Facebook Page", postToFacebook, (v) {
              setState(() => postToFacebook = v);
            }),

            _platformToggle("Instagram", postToInstagram, (v) {
              setState(() => postToInstagram = v);
            }),

            _platformToggle("TikTok", postToTikTok, (v) {
              setState(() => postToTikTok = v);
            }),

            _platformToggle("Twitter / X", postToTwitter, (v) {
              setState(() => postToTwitter = v);
            }),

            _platformToggle("LinkedIn", postToLinkedIn, (v) {
              setState(() => postToLinkedIn = v);
            }),

            const SizedBox(height: 25),

            SwitchListTile(
              title: const Text("Schedule Post"),
              value: isScheduled,
              onChanged: (v) {
                setState(() {
                  isScheduled = v;
                  if (!v) scheduledDate = null;
                });
              },
            ),

            if (isScheduled)
              ListTile(
                title: Text(
                  scheduledDate == null
                      ? "Select date & time"
                      : "Scheduled for: $scheduledDate",
                ),
                trailing: const Icon(Icons.calendar_month),
                onTap: _pickSchedule,
              ),

            const SizedBox(height: 30),

            ElevatedButton(
              onPressed: isPosting ? null : _publishPost,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: isPosting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Publish Now", style: TextStyle(fontSize: 18)),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _platformToggle(String name, bool value, Function(bool) onChanged) {
    return SwitchListTile(
      title: Text(name),
      value: value,
      onChanged: onChanged,
    );
  }

  void _selectMedia() async {
    // For now we simulate media selection
    await Future.delayed(const Duration(milliseconds: 500));

    setState(() {
      attachedMedia = "file://fake_media.jpg";
    });
  }

  void _pickSchedule() async {
    DateTime now = DateTime.now();

    final DateTime? date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: DateTime(now.year + 2),
    );

    if (date == null) return;

    final TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (time == null) return;

    setState(() {
      scheduledDate = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _publishPost() async {
    if (postController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Post content cannot be empty")),
      );
      return;
    }

    if (!postToFacebook &&
        !postToInstagram &&
        !postToTikTok &&
        !postToTwitter &&
        !postToLinkedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Select at least one platform")),
      );
      return;
    }

    setState(() => isPosting = true);

    await Future.delayed(const Duration(seconds: 2)); // simulate upload

    setState(() => isPosting = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isScheduled
              ? "Post scheduled for $scheduledDate"
              : "Post published to selected platforms",
        ),
      ),
    );
  }
}
