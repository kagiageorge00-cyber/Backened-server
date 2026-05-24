import 'package:flutter/material.dart';

class AIPhotoMakerScreen extends StatefulWidget {
  const AIPhotoMakerScreen({super.key});

  @override
  State<AIPhotoMakerScreen> createState() => _AIPhotoMakerScreenState();
}

class _AIPhotoMakerScreenState extends State<AIPhotoMakerScreen> {
  final TextEditingController promptController = TextEditingController();
  bool isLoading = false;
  String? imageUrl;

  String selectedStyle = "Professional";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("AI Photo Maker"),
        backgroundColor: Colors.deepPurple,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: promptController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: "Describe the photo you want…",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 16),
            DropdownButton<String>(
              value: selectedStyle,
              items: const [
                DropdownMenuItem(value: "Professional", child: Text("Professional")),
                DropdownMenuItem(value: "Modern", child: Text("Modern")),
                DropdownMenuItem(value: "Realistic", child: Text("Realistic")),
                DropdownMenuItem(value: "Cartoon", child: Text("Cartoon")),
              ],
              onChanged: (v) => setState(() => selectedStyle = v!),
            ),

            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isLoading ? null : _generateImage,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple),
              child: isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Generate Image"),
            ),

            const SizedBox(height: 20),

            if (imageUrl != null)
              Image.network(imageUrl!, height: 200, fit: BoxFit.cover),
          ],
        ),
      ),
    );
  }

  Future<void> _generateImage() async {
    setState(() => isLoading = true);
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      isLoading = false;
      imageUrl = "https://your-backend/generated-image.png";
    });
  }
}
