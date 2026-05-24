import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/firestore_service.dart';
import '../models/candidate_model.dart';
import '../constants/colors.dart';
import '../constants/styles.dart';

class CandidateUploadScreen extends StatefulWidget {
  final String agentId;
  const CandidateUploadScreen({super.key, required this.agentId});

  @override
  State<CandidateUploadScreen> createState() => _CandidateUploadScreenState();
}

class _CandidateUploadScreenState extends State<CandidateUploadScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _skillsController = TextEditingController();
  final _experienceController = TextEditingController();

  File? _photoFile;
  File? _cvFile;
  File? _videoFile;

  bool _isUploading = false;
  bool _isSubscriptionActive = false;
  bool _loadingSubscription = true;
  final ImagePicker _picker = ImagePicker();
  final FirestoreService _firestoreService = FirestoreService();

  // ------------------------
  // Pick Photo
  // ------------------------
  Future<void> _pickPhoto() async {
    final picked =
        await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) setState(() => _photoFile = File(picked.path));
  }

  // ------------------------
  // Pick CV
  // ------------------------
  Future<void> _pickCV() async {
    final picked = await _picker.pickImage(
        source: ImageSource.gallery); // replace with PDF picker if needed
    if (picked != null) setState(() => _cvFile = File(picked.path));
  }

  // ------------------------
  // Pick Video
  // ------------------------
  Future<void> _pickVideo() async {
    final picked = await _picker.pickVideo(source: ImageSource.gallery);
    if (picked != null) setState(() => _videoFile = File(picked.path));
  }

  @override
  void initState() {
    super.initState();
    _checkSubscription();
  }

  Future<void> _checkSubscription() async {
    setState(() {
      _loadingSubscription = true;
    });
    // TODO: Replace this with backend server API integration.
    await Future.delayed(const Duration(milliseconds: 250));
    _isSubscriptionActive = true;
    setState(() {
      _loadingSubscription = false;
    });
  }

  // ------------------------
  // Upload Candidate
  // ------------------------
  Future<void> _uploadCandidate() async {
    if (!_loadingSubscription && !_isSubscriptionActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Subscription is inactive. Please renew to upload candidates.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    if (_photoFile == null || _cvFile == null || _videoFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload photo, CV, and video')),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      // Upload files to Firestore / Storage
      final photoUrl =
          await _firestoreService.uploadFile(_photoFile!, 'candidate_photos');
      final cvUrl =
          await _firestoreService.uploadFile(_cvFile!, 'candidate_cvs');
      final videoUrl =
          await _firestoreService.uploadFile(_videoFile!, 'candidate_videos');

      // Create candidate object
      final candidate = CandidateModel(
        candidateId: '', // Firestore auto-generates
        agentId: widget.agentId,
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        skills: _skillsController.text.trim(),
        experience: _experienceController.text.trim(),
        photoUrl: photoUrl,
        cvUrl: cvUrl,
        videoUrl: videoUrl,
        status: 'available',
        createdAt: DateTime.now(),
      );

      await _firestoreService.addCandidate(candidate);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Candidate uploaded successfully')),
      );

      _formKey.currentState!.reset();
      setState(() {
        _photoFile = null;
        _cvFile = null;
        _videoFile = null;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: $e')),
      );
    }

    setState(() => _isUploading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Candidate'),
        backgroundColor: AppColors.primary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              if (_loadingSubscription) const LinearProgressIndicator(),
              if (!_loadingSubscription && !_isSubscriptionActive)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.orange),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                            'Your agent subscription is inactive. Renew under subscription to upload candidates.'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pushNamed(context, '/agentSubscription',
                              arguments: {'agentId': widget.agentId});
                        },
                        child: const Text('Renew'),
                      ),
                    ],
                  ),
                ),
              // Full Name
              TextFormField(
                controller: _fullNameController,
                decoration: AppStyles.inputDecoration('Full Name'),
                style: const TextStyle(color: AppColors.textPrimary),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Enter full name' : null,
              ),
              const SizedBox(height: 12),

              // Email
              TextFormField(
                controller: _emailController,
                decoration: AppStyles.inputDecoration('Email'),
                style: const TextStyle(color: AppColors.textPrimary),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Enter email';
                  if (!v.contains('@')) return 'Enter valid email';
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Phone
              TextFormField(
                controller: _phoneController,
                decoration: AppStyles.inputDecoration('Phone'),
                style: const TextStyle(color: AppColors.textPrimary),
                validator: (v) => v == null || v.isEmpty ? 'Enter phone' : null,
              ),
              const SizedBox(height: 12),

              // Skills
              TextFormField(
                controller: _skillsController,
                decoration:
                    AppStyles.inputDecoration('Skills (comma separated)'),
                style: const TextStyle(color: AppColors.textPrimary),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Enter skills' : null,
              ),
              const SizedBox(height: 12),

              // Experience
              TextFormField(
                controller: _experienceController,
                decoration: AppStyles.inputDecoration('Experience'),
                style: const TextStyle(color: AppColors.textPrimary),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Enter experience' : null,
              ),
              const SizedBox(height: 16),

              // Upload Buttons
              Row(
                children: [
                  ElevatedButton(
                      onPressed: _pickPhoto, child: const Text('Upload Photo')),
                  const SizedBox(width: 12),
                  _photoFile != null
                      ? const Icon(Icons.check_circle, color: Colors.green)
                      : Container(),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  ElevatedButton(
                      onPressed: _pickCV, child: const Text('Upload CV')),
                  const SizedBox(width: 12),
                  _cvFile != null
                      ? const Icon(Icons.check_circle, color: Colors.green)
                      : Container(),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  ElevatedButton(
                      onPressed: _pickVideo, child: const Text('Upload Video')),
                  const SizedBox(width: 12),
                  _videoFile != null
                      ? const Icon(Icons.check_circle, color: Colors.green)
                      : Container(),
                ],
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isUploading ? null : _uploadCandidate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isUploading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Upload Candidate',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
