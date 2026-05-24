import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../services/candidate_video_service.dart';

class VideoUploadScreen extends StatefulWidget {
  final String candidateId;
  final File fullPhoto; // required full photo
  final File idPhoto; // required ID/passport photo
  final String resumeText; // required resume text

  const VideoUploadScreen({
    super.key,
    required this.candidateId,
    required this.fullPhoto,
    required this.idPhoto,
    required this.resumeText,
  });

  @override
  State<VideoUploadScreen> createState() => _VideoUploadScreenState();
}

class _VideoUploadScreenState extends State<VideoUploadScreen> {
  File? _videoFile;
  VideoPlayerController? _videoController;
  bool _uploading = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    // Load a default demo video from assets (video8.mp4) so the screen shows a sample
    _videoController = VideoPlayerController.asset('assets/videos/video8.mp4')
      ..initialize().then((_) {
        setState(() {});
        _videoController!.setLooping(true);
        _videoController!.play();
      });
  }

  Future<void> _pickVideo() async {
    final XFile? picked = await _picker.pickVideo(source: ImageSource.gallery);
    if (picked != null) {
      _videoFile = File(picked.path);
      // dispose previous controller (asset) before switching to file controller
      await _videoController?.pause();
      _videoController?.dispose();
      _videoController = VideoPlayerController.file(_videoFile!)
        ..initialize().then((_) {
          setState(() {});
          _videoController!.setLooping(false);
          _videoController!.play();
        });
    }
  }

  Future<void> _uploadAll() async {
    if (_videoFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a video first")),
      );
      return;
    }

    setState(() => _uploading = true);

    try {
      final result = await CandidateVideoService.uploadCandidateVideo(
        userId: widget.candidateId,
        videoFile: _videoFile!,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Video uploaded successfully! Pending review.")),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Upload failed: $e")),
      );
    } finally {
      setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text("Upload Introduction Video"),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_videoController != null &&
                _videoController!.value.isInitialized)
              AspectRatio(
                aspectRatio: _videoController!.value.aspectRatio,
                child: VideoPlayer(_videoController!),
              ),
            const SizedBox(height: 20),
            ElevatedButton(
                onPressed: _pickVideo, child: const Text("Pick Video")),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _uploading ? null : _uploadAll,
              child: _uploading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Upload & Publish Candidate"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }
}
