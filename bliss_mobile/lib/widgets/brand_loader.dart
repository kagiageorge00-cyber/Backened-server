import 'package:flutter/material.dart';

/// BrandLoader: Circular progress indicator styled with brand colors
class BrandLoader extends StatelessWidget {
  final double size;

  const BrandLoader({
    super.key,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final secondary = Theme.of(context).colorScheme.secondary;
    final accent = Colors.amber.shade600;

    return SizedBox(
      height: size,
      width: size,
      child: ShaderMask(
        shaderCallback: (rect) {
          return SweepGradient(
            startAngle: 0.0,
            endAngle: 6.28,
            colors: [primary, secondary, accent, primary],
            stops: const [0.0, 0.45, 0.8, 1.0],
          ).createShader(rect);
        },
        blendMode: BlendMode.srcATop,
        child: const CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
        ),
      ),
    );
  }
}
