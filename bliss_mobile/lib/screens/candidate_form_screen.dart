import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../widgets/professional_file_upload_tile.dart';

class CandidateFormScreen extends StatefulWidget {
  final String? phone;
  final String? candidateId;

  const CandidateFormScreen({
    super.key,
    this.phone,
    this.candidateId,
  });

  @override
  State<CandidateFormScreen> createState() => _CandidateFormScreenState();
}

class _CandidateFormScreenState extends State<CandidateFormScreen> {
  static const String baseUrl = ApiConfig.baseUrl;

  bool isSaving = false;

  String? candidateId;
  String? phone;

  final Map<String, String?> docs = {
    'passport': null,
    'photo': null,
    'video': null,
    'medical': null,
    'conduct': null,
    'resume': null,
    'additional': null,
  };

  @override
  void initState() {
    super.initState();

    final uri = Uri.base;

    // Prefer values passed via constructor (from main), otherwise check
    // the standard query parameters and finally the fragment query string.
    candidateId = widget.candidateId ?? uri.queryParameters['candidateId'];
    phone = widget.phone ?? uri.queryParameters['phone'];

    if ((candidateId == null || phone == null) &&
        Uri.base.fragment.isNotEmpty) {
      var frag = Uri.base.fragment;
      if (frag.startsWith('#')) frag = frag.substring(1);
      if (frag.startsWith('/#/')) frag = frag.substring(2);

      if (frag.contains('?')) {
        final qs = frag.split('?').last;
        final params = Uri.splitQueryString(qs);
        candidateId = candidateId ?? params['candidateId'];
        phone = phone ?? params['phone'];
      }
    }

    debugPrint('CandidateId: $candidateId');
    debugPrint('Phone: $phone');
  }

  bool get canSubmit =>
      docs['passport'] != null &&
      docs['photo'] != null &&
      docs['video'] != null &&
      docs['medical'] != null &&
      docs['conduct'] != null;

  void saveDoc(String key, String url) {
    setState(() {
      docs[key] = url;
    });
    debugPrint('CandidateForm: saved doc $key => $url');
  }

  String _generateCandidateId() {
    final year = DateTime.now().year;
    final random = Random();
    final seq = 1000 + random.nextInt(9000);
    return 'CAND-$year-$seq';
  }

  String _generatePassword() {
    // Temporary password format: BLISS####
    final random = Random();
    final num = 1000 + random.nextInt(9000);
    return 'BLISS$num';
  }

  Future<void> submit() async {
    final contactPhone = phone;

    if (contactPhone == null || contactPhone.isEmpty) {
      error('Missing phone number');
      return;
    }

    if (!canSubmit) {
      final required = ['passport', 'photo', 'video', 'medical'];
      final missing = required.where((k) => docs[k] == null).toList();
      error('Missing required documents: ${missing.join(', ')}');
      return;
    }

    setState(() {
      isSaving = true;
    });

    try {
      final newCandidateId = _generateCandidateId();
      final tempPassword = _generatePassword();

      final response = await http.post(
        Uri.parse('$baseUrl/api/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fullName': 'Candidate',
          'phone': contactPhone,
          'country': 'Kenya',
          'passportUrl': docs['passport'],
          'photoUrl': docs['photo'],
          'videoUrl': docs['video'],
          'medicalUrl': docs['medical'],
          'conductUrl': docs['conduct'],
          'resumeUrl': docs['resume'],
          'additionalUrl': docs['additional'],
        }),
      );

      final data = jsonDecode(response.body);

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          data['success'] == true) {
        final serverId = data['candidateId'] ?? newCandidateId;
        final serverPassword = data['password'] ?? tempPassword;

        success(
          candidateIdGenerated: serverId,
          passwordGenerated: serverPassword,
        );
      } else {
        error(data['error'] ?? 'Registration failed');
      }
    } catch (e) {
      error(e.toString());
    }

    setState(() {
      isSaving = false;
    });
  }

  void success({
    required String candidateIdGenerated,
    required String passwordGenerated,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('Registration Successful! 🎉'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your account has been created successfully.'),
              const SizedBox(height: 20),
              const Text(
                'Your Login Credentials:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Candidate ID',
                                  style: TextStyle(
                                      fontSize: 11, color: Colors.grey)),
                              const SizedBox(height: 4),
                              Text(candidateIdGenerated,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      fontFamily: 'monospace')),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          onPressed: () {
                            Clipboard.setData(
                              ClipboardData(text: candidateIdGenerated),
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('✓ Candidate ID copied'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Password',
                                  style: TextStyle(
                                      fontSize: 11, color: Colors.grey)),
                              const SizedBox(height: 4),
                              Text(passwordGenerated,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      fontFamily: 'monospace')),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          onPressed: () {
                            Clipboard.setData(
                              ClipboardData(text: passwordGenerated),
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('✓ Password copied'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, size: 18, color: Colors.blue),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Save credentials to log in to the candidate portal.',
                        style: TextStyle(fontSize: 12, color: Colors.blue),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void error(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Widget uploadTile(
    String title,
    String key,
    List<String> extensions,
  ) {
    return ProfessionalFileUploadTile(
      title: title,
      storageFolder: 'candidate_documents/${candidateId ?? phone}/$key',
      allowedExtensions: extensions,
      onUploadComplete: (url) {
        saveDoc(key, url);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Candidate Documents'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (candidateId != null) Text('Candidate ID: $candidateId'),
            if (phone != null) Text('Phone: $phone'),
            const SizedBox(height: 20),
            uploadTile(
              'Passport PDF',
              'passport',
              ['pdf'],
            ),
            uploadTile(
              'Photo',
              'photo',
              ['jpg', 'jpeg', 'png'],
            ),
            uploadTile(
              'Video',
              'video',
              ['mp4', 'mov'],
            ),
            uploadTile(
              'Medical Report',
              'medical',
              ['pdf'],
            ),
            uploadTile(
              'Good Conduct Certificate (Required)',
              'conduct',
              ['pdf'],
            ),
            uploadTile(
              'Resume',
              'resume',
              ['pdf', 'doc', 'docx'],
            ),
            uploadTile(
              'Additional Document',
              'additional',
              ['pdf', 'doc', 'docx', 'jpg', 'png'],
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isSaving ? null : submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Colors.green,
                ),
                child: isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Text(
                        'REGISTER',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
