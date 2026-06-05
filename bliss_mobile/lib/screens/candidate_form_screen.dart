import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../widgets/professional_file_upload_tile.dart';

class CandidateFormScreen extends StatefulWidget {
  final String? phone;
  final String? candidateId;

  const CandidateFormScreen({super.key, this.phone, this.candidateId});

  @override
  State<CandidateFormScreen> createState() => _CandidateFormScreenState();
}

class _CandidateFormScreenState extends State<CandidateFormScreen> {
  bool isSaving = false;
  String? _candidateId;
  String? _phone;
  bool _candidateExists = true; // ✅ NEW FIELD

  static const String baseUrl = ApiConfig.baseUrl;

  final Map<String, String?> _uploadedDocs = {
    'passport': null,
    'photo': null,
    'video': null,
    'medical': null,
    'resume': null,
    'additional': null,
  };

  @override
  void initState() {
    super.initState();
    _candidateId =
        widget.candidateId ?? Uri.base.queryParameters['candidateId'];
    _phone = widget.phone ??
        Uri.base.queryParameters['phone']; // ✅ GET PHONE FROM URL
    _loadCandidateData(); // ✅ LOAD DATA IF EXISTS
  }

  // ✅ NEW METHOD: Load existing candidate data
  Future<void> _loadCandidateData() async {
    try {
      final queryParam = _candidateId ?? _phone;
      if (queryParam == null || queryParam.isEmpty) {
        setState(() => _candidateExists = false);
        return;
      }

      final url = _candidateId != null
          ? '$baseUrl/api/candidate-form/data?candidateId=$queryParam'
          : '$baseUrl/api/candidate-form/data?phone=${Uri.encodeComponent(queryParam)}';

      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _candidateExists = data['candidateExists'] ?? false;
          // Pre-fill phone from response if available
          if (data['data'] != null && data['data']['phone'] != null) {
            _phone = data['data']['phone'];
          }
        });
      } else {
        setState(() => _candidateExists = false);
      }
    } catch (e) {
      debugPrint('Error loading candidate data: $e');
      setState(() => _candidateExists = false);
    }
  }

  bool get _hasRequiredFiles {
    return _uploadedDocs['passport'] != null &&
        _uploadedDocs['photo'] != null &&
        _uploadedDocs['video'] != null &&
        _uploadedDocs['medical'] != null;
  }

  void _saveDocumentUrl(String key, String url) {
    setState(() {
      _uploadedDocs[key] = url;
    });
  }

  Future<void> _submitDocuments() async {
    // ✅ UPDATED: Use candidateId or phone for submission
    final submitId = _candidateId ?? _phone;
    if (submitId == null || submitId.isEmpty) {
      showError('Candidate ID or Phone is required to submit documents.');
      return;
    }

    if (!_hasRequiredFiles) {
      showError(
        'Please upload passport, photo, medical report and video to continue.',
      );
      return;
    }

    setState(() => isSaving = true);

    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/candidates/$submitId/documents'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'passportUrl': _uploadedDocs['passport'],
          'photoUrl': _uploadedDocs['photo'],
          'videoUrl': _uploadedDocs['video'],
          'medicalUrl': _uploadedDocs['medical'],
          'resumeUrl': _uploadedDocs['resume'],
          'additionalUrl': _uploadedDocs['additional'],
          'phone': _phone, // ✅ PASS PHONE FOR CANDIDATE CREATION
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        showSuccess();
      } else {
        showError(data['error'] ?? 'Failed to submit documents');
      }
    } catch (e) {
      showError('Upload failed: $e');
    } finally {
      setState(() => isSaving = false);
    }
  }

  void showSuccess() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('✅ Registration Complete!'),
        content: const Text(
          'Congratulations! Your registration is now complete.\n\n'
          'Your profile has been posted to the Bliss Connect marketplace.\n\n'
          'You will receive an email shortly with:\n'
          '• Your unique candidate code\n'
          '• Password for the candidate portal\n'
          '• Login link to track opportunities\n\n'
          'Check your email for these important details!',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }

  Widget _buildDocTile(
    String title,
    String key,
    List<String> extensions,
    String storageFolder,
  ) {
    return ProfessionalFileUploadTile(
      title: title,
      storageFolder: storageFolder,
      allowedExtensions: extensions,
      onUploadComplete: (url) => _saveDocumentUrl(key, url),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Upload documents to complete your candidate profile',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Please upload the required files below after your payment has been approved. '
              'Required uploads are passport (PDF), a recent photo, medical report (PDF), and video introduction.',
            ),
            const SizedBox(height: 16),
            // ✅ SHOW INFO: Candidate ID or Phone
            if (_candidateId != null)
              _buildInfoRow('Candidate ID', _candidateId!),
            if (_phone != null) _buildInfoRow('Phone', _phone!),
            // ✅ SHOW STATUS
            if (!_candidateExists)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  border: Border.all(color: Colors.blue),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '✅ Your payment has been approved. Please upload documents to complete registration.',
                  style: TextStyle(color: Colors.blue, fontSize: 14),
                ),
              ),
            const SizedBox(height: 16),
            _buildDocTile(
              'Passport (PDF)',
              'passport',
              ['pdf'],
              'candidate_documents/${_candidateId ?? _phone}/passport',
            ),
            _buildDocTile(
              'Photo (JPG, PNG)',
              'photo',
              ['jpg', 'jpeg', 'png'],
              'candidate_documents/${_candidateId ?? _phone}/photo',
            ),
            _buildDocTile(
              'Video Introduction (MP4)',
              'video',
              ['mp4', 'mov', 'avi', 'mkv'],
              'candidate_documents/${_candidateId ?? _phone}/video',
            ),
            _buildDocTile(
              'Medical Report (PDF)',
              'medical',
              ['pdf'],
              'candidate_documents/${_candidateId ?? _phone}/medical',
            ),
            _buildDocTile(
              'Resume / CV (PDF, DOC)',
              'resume',
              ['pdf', 'doc', 'docx'],
              'candidate_documents/${_candidateId ?? _phone}/resume',
            ),
            _buildDocTile(
              'Additional Document',
              'additional',
              ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
              'candidate_documents/${_candidateId ?? _phone}/additional',
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isSaving ? null : _submitDocuments,
                child: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Submit Documents'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
