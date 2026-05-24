import 'package:flutter/material.dart';

class Logo extends StatelessWidget {
  final double? height;
  final double? width;
  final BoxFit fit;

  // Increased default size for prominent display across the app
  const Logo({super.key, this.height = 160, this.width, this.fit = BoxFit.contain});

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/logo.png',
      height: height,
      width: width,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
    );
  }
}
