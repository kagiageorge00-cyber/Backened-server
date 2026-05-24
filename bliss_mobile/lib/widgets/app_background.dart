import 'package:flutter/material.dart';

/// A reusable background widget that displays a subtle background image
/// beneath the app content without interfering with UI interactions.
///
/// The background image is displayed with low opacity to maintain text
/// readability and work seamlessly with both light and dark themes.
///
/// Usage:
/// ```dart
/// AppBackground(
///   child: Scaffold(
///     backgroundColor: Colors.transparent,
///     body: YourPageContent(),
///   ),
/// )
/// ```
class AppBackground extends StatelessWidget {
  /// The main content widget to display on top of the background
  final Widget child;

  /// The opacity level of the background image (0.0 - 1.0)
  /// Defaults to 0.1 for subtle appearance
  final double backgroundOpacity;

  /// The fit mode for the background image
  /// Defaults to BoxFit.cover to fill the entire screen
  final BoxFit imageFit;

  const AppBackground({super.key, 
    required this.child,
    this.backgroundOpacity = 0.1,
    this.imageFit = BoxFit.cover,
  }) : assert(
    backgroundOpacity >= 0.0 && backgroundOpacity <= 1.0,
    'backgroundOpacity must be between 0.0 and 1.0',
  );

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Background layer with low opacity
        Positioned.fill(
          child: Opacity(
            opacity: backgroundOpacity,
            child: Image.asset(
              'assets/images/background.png',
              fit: imageFit,
              errorBuilder: (context, error, stackTrace) {
                // Fallback in case image is not found
                return Container(
                  color: Colors.grey.shade200,
                );
              },
            ),
          ),
        ),
        // Content layer on top
        child,
      ],
    );
  }
}
