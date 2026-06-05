import 'package:bliss_mobile/services/upload_service.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

/// Professional file upload widget with progress, preview, and validation
class ProfessionalFileUploadTile extends StatefulWidget {
  final String title;
  final String storageFolder;
  final List<String> allowedExtensions;
  final void Function(String url)? onUploadComplete;
  final String? initialUrl;

  const ProfessionalFileUploadTile({
    super.key,
    required this.title,
    required this.storageFolder,
    this.allowedExtensions = const ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    this.onUploadComplete,
    this.initialUrl,
  });

  @override
  State<ProfessionalFileUploadTile> createState() =>
      _ProfessionalFileUploadTileState();
}

class _ProfessionalFileUploadTileState
    extends State<ProfessionalFileUploadTile> {
  PlatformFile? _file;
  double _progress = 0;
  String? _uploadedUrl;
  String? _error;

  @override
  void initState() {
    super.initState();
    _uploadedUrl = widget.initialUrl;
  }

  Future<void> _pickAndUploadFile() async {
    setState(() {
      _error = null;
    });
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: widget.allowedExtensions,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    setState(() {
      _file = file;
      _progress = 0;
    });
    try {
      final String? url;
      if (file.bytes != null) {
        url = await UploadService.uploadFile(
          bytes: file.bytes!,
          fileName: '${DateTime.now().millisecondsSinceEpoch}_${file.name}',
        );
      } else if (file.path != null) {
        url = await UploadService.uploadFile(
          filePath: file.path!,
          fileName: file.name,
        );
      } else {
        throw Exception('Invalid file');
      }
      if (url == null) throw Exception('Upload returned null URL');
      setState(() {
        _uploadedUrl = url;
        _progress = 1;
      });
      if (widget.onUploadComplete != null) widget.onUploadComplete!(url);
    } catch (e) {
      setState(() {
        _error = 'Upload failed: $e';
        _progress = 0;
      });
    }
  }

  Widget _buildPreview() {
    if (_uploadedUrl != null && _uploadedUrl!.endsWith('.pdf')) {
      return const Icon(Icons.picture_as_pdf, color: Colors.red, size: 40);
    } else if (_uploadedUrl != null &&
        (_uploadedUrl!.endsWith('.jpg') ||
            _uploadedUrl!.endsWith('.jpeg') ||
            _uploadedUrl!.endsWith('.png'))) {
      return Image.network(_uploadedUrl!,
          height: 40, width: 40, fit: BoxFit.cover);
    } else if (_uploadedUrl != null) {
      return const Icon(Icons.insert_drive_file, color: Colors.blue, size: 40);
    } else {
      return const Icon(Icons.upload_file_outlined,
          color: Color(0xFF1565C0), size: 40);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: _pickAndUploadFile,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              _buildPreview(),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.title,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    if (_file != null) ...[
                      const SizedBox(height: 4),
                      Text(_file!.name, style: const TextStyle(fontSize: 12)),
                    ],
                    if (_progress > 0 && _progress < 1)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: LinearProgressIndicator(value: _progress),
                      ),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(_error!,
                            style: const TextStyle(
                                color: Colors.red, fontSize: 12)),
                      ),
                  ],
                ),
              ),
              if (_uploadedUrl != null)
                IconButton(
                  icon: const Icon(Icons.clear, color: Colors.grey),
                  onPressed: () => setState(() {
                    _uploadedUrl = null;
                    _file = null;
                  }),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
