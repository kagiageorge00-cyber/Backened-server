import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/candidate_service.dart';

class DocumentsScreen extends StatefulWidget {
  final ApiClient api;
  const DocumentsScreen({super.key, required this.api});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _documents;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _documents = _service.getDocuments();
  }

  Future<void> _refresh() async {
    setState(() {
      _documents = _service.getDocuments();
    });
    await _documents;
  }

  Future<void> _pickAndUpload() async {
    final currentContext = context;
    final result = await FilePicker.platform.pickFiles(withData: true);
    if (result == null || result.files.isEmpty) return;
    setState(() => _uploading = true);
    try {
      final file = result.files.first;
      final docType = await showDialog<String>(
        context: currentContext,
        builder: (dialogContext) {
          String selectedType = 'passport';
          return StatefulBuilder(
            builder: (dialogContext, setState) {
              return AlertDialog(
                title: const Text('Document type'),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    RadioListTile<String>(
                      title: const Text('Passport'),
                      value: 'passport',
                      groupValue: selectedType,
                      onChanged: (value) {
                        if (value != null) setState(() => selectedType = value);
                      },
                    ),
                    RadioListTile<String>(
                      title: const Text('National ID'),
                      value: 'nationalId',
                      groupValue: selectedType,
                      onChanged: (value) {
                        if (value != null) setState(() => selectedType = value);
                      },
                    ),
                    RadioListTile<String>(
                      title: const Text('Resume'),
                      value: 'resume',
                      groupValue: selectedType,
                      onChanged: (value) {
                        if (value != null) setState(() => selectedType = value);
                      },
                    ),
                    RadioListTile<String>(
                      title: const Text('Other'),
                      value: 'other',
                      groupValue: selectedType,
                      onChanged: (value) {
                        if (value != null) setState(() => selectedType = value);
                      },
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(dialogContext, null),
                      child: const Text('Cancel')),
                  ElevatedButton(
                      onPressed: () =>
                          Navigator.pop(dialogContext, selectedType),
                      child: const Text('Upload')),
                ],
              );
            },
          );
        },
      );
      if (!mounted) return;
      if (docType == null) return;
      final response = await _service.uploadDocument(file, docType);
      if (!mounted) return;
      if (response['success'] == true) {
        ScaffoldMessenger.of(currentContext)
            .showSnackBar(const SnackBar(content: Text('Document uploaded')));
        await _refresh();
      } else {
        ScaffoldMessenger.of(currentContext).showSnackBar(SnackBar(
            content: Text('Upload failed: ${response['error'] ?? 'unknown'}')));
      }
    } catch (error) {
      ScaffoldMessenger.of(currentContext)
          .showSnackBar(SnackBar(content: Text('Upload error: $error')));
    } finally {
      setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton.icon(
            onPressed: _uploading ? null : _pickAndUpload,
            icon: const Icon(Icons.upload_file),
            label: Text(_uploading ? 'Uploading...' : 'Upload Document'),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Map<String, dynamic>>>(
            future: _documents,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text('Error: ${snapshot.error}'));
              }
              final docs = snapshot.data ?? [];
              if (docs.isEmpty) {
                return const Center(child: Text('No documents uploaded yet.'));
              }
              return RefreshIndicator(
                onRefresh: _refresh,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final doc = docs[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        title:
                            Text(doc['documentType']?.toString() ?? 'Document'),
                        subtitle: Text(doc['status']?.toString() ?? 'Uploaded'),
                        trailing: IconButton(
                          icon: const Icon(Icons.open_in_new),
                          onPressed: null,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
