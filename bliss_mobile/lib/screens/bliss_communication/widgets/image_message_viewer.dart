import 'package:flutter/material.dart';

class ImageMessageViewer extends StatelessWidget {
  final String imageUrl;

  const ImageMessageViewer({super.key, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => showDialog(
        context: context,
        builder: (_) => Dialog(
          child: InteractiveViewer(
            child: Image.network(imageUrl),
          ),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(imageUrl, width: 200),
      ),
    );
  }
}
