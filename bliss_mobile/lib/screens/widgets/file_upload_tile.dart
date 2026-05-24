import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class FileUploadTile extends StatefulWidget {
  final String title;
  final String hint;
  final bool allowImagePreview;
  final Function(File?) onFilePicked;

  const FileUploadTile({
    super.key,
    required this.title,
    required this.hint,
    required this.onFilePicked,
    this.allowImagePreview = true,
  });

  @override
  State<FileUploadTile> createState() => _FileUploadTileState();
}

class _FileUploadTileState extends State<FileUploadTile> {
  File? _file;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final XFile? picked =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() {
        _file = File(picked.path);
      });
      widget.onFilePicked(_file);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _pickImage,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            if (widget.allowImagePreview)
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: const Color(0xFFF5F7FA),
                  image: _file != null
                      ? DecorationImage(image: FileImage(_file!), fit: BoxFit.cover)
                      : null,
                ),
                child: _file == null
                    ? const Icon(Icons.upload_file_outlined, color: Color(0xFF1565C0))
                    : null,
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(widget.hint, style: const TextStyle(color: Colors.grey))
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey)
          ],
        ),
      ),
    );
  }
}
