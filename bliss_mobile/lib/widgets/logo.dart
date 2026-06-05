import 'package:flutter/material.dart';

class Logo extends StatelessWidget {
  final double? height;
  final double? width;
  final BoxFit fit;

  const Logo({
    super.key,
    this.height = 80,
    this.width,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/admin');
      },
      child: Image.asset(
        'assets/images/logo.png',
        height: height,
        width: width,
        fit: fit,
        errorBuilder: (context, error, stackTrace) {
          return const Icon(
            Icons.image_not_supported,
            size: 60,
            color: Colors.red,
          );
        },
      ),
    );
  }
}
