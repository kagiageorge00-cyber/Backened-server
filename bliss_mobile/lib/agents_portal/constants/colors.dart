import 'package:flutter/material.dart';

// Using main app brand colors for consistency
class AppColors {
  // ------------------------
  // Primary Brand Colors (from main theme)
  // ------------------------
  static const Color primary = Color(0xFF0175C2); // Main brand blue
  static const Color primaryLight = Color(0xFF4DA8E0);
  static const Color primaryDark = Color(0xFF01579B);

  // ------------------------
  // Secondary Colors
  // ------------------------
  static const Color secondary = Color(0xFF00ACC1); // Teal accent
  static const Color secondaryLight = Color(0xFF4DD0E1);
  static const Color secondaryDark = Color(0xFF00838F);

  // ------------------------
  // Accent Colors
  // ------------------------
  static const Color accent = Color(0xFFFF9800); // Orange accent
  static const Color accentLight = Color(0xFFFFC966);
  static const Color accentDark = Color(0xFFCC8400);

  // ------------------------
  // Success / Error / Warning
  // ------------------------
  static const Color success = Color(0xFF4CAF50); // Green
  static const Color error = Color(0xFFF44336); // Red
  static const Color warning = Color(0xFFFFC107); // Amber

  // ------------------------
  // Background / Surface
  // ------------------------
  static const Color background = Color(0xFFFAFAFA); // Light background
  static const Color surface = Colors.white;
  static const Color card = Colors.white;

  // ------------------------
  // Text Colors
  // ------------------------
  static const Color textPrimary = Color(0xFF212121); // Dark Grey
  static const Color textSecondary = Color(0xFF757575); // Medium Grey
  static const Color textLight = Colors.white;

  // ------------------------
  // Divider / Border
  // ------------------------
  static const Color divider = Color(0xFFE0E0E0); // Light Grey
  static const Color border = Color(0xFFBDBDBD); // Medium Grey

  // ------------------------
  // Buttons
  // ------------------------
  static const Color buttonPrimary = primary;
  static const Color buttonSecondary = secondary;
  static const Color buttonDisabled = Color(0xFFBDBDBD);

  // ------------------------
  // Shadow / Elevation
  // ------------------------
  static const Color shadow = Color(0x1A000000); // 10% black
}
