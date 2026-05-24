import 'package:flutter/material.dart';

class AIVideoMakerScreen extends StatefulWidget {
  const AIVideoMakerScreen({super.key});

  @override
  State<AIVideoMakerScreen> createState() => _AIVideoMakerScreenState();
}

class _AIVideoMakerScreenState extends State<AIVideoMakerScreen> {
  final TextEditingController scriptController = TextEditingController();
  bool isLoading = false;
  String? videoUrl;

  String selectedVoice = "Female";
  String selectedLanguage = "English";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("AI Video Maker"),
        backgroundColor: Colors.deepPurple,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Enter Script", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            TextField(
              controller: scriptController,
              maxLines: 6,
              decoration: const InputDecoration(
                hintText: "Write your content here...",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 16),
            const Text("Choose Voice", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),

            DropdownButton<String>(
              value: selectedVoice,
              items: const [
                DropdownMenuItem(value: "Female", child: Text("Female")),
                DropdownMenuItem(value: "Male", child: Text("Male")),
              ],
              onChanged: (v) => setState(() => selectedVoice = v!),
            ),

            const SizedBox(height: 16),
            const Text("Language", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),

            DropdownButton<String>(
              value: selectedLanguage,
              items: const [
                DropdownMenuItem(value: "English", child: Text("English")),
                DropdownMenuItem(value: "Arabic", child: Text("Arabic")),
                DropdownMenuItem(value: "Swahili", child: Text("Swahili")),
              ],
              onChanged: (v) => setState(() => selectedLanguage = v!),
            ),

            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: isLoading ? null : _generateVideo,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Generate Video"),
            ),

            const SizedBox(height: 20),

            if (videoUrl != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Generated Video:",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 200,
                    color: Colors.black12,
                    child: Center(
                      child: Text("Video preview here\nURL:\n$videoUrl"),
                    ),
                  )
                ],
              )
          ],
        ),
      ),
    );
  }

  Future<void> _generateVideo() async {
    setState(() => isLoading = true);

    await Future.delayed(const Duration(seconds: 2)); // fake loading

    setState(() {
      isLoading = false;
      videoUrl = "https://your-backend/video123.mp4";
    });
  }
}
