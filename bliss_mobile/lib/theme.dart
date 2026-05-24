import 'package:flutter/material.dart';

// Brand Theme Colors
const Color _primary = Color(0xFF0D47A1); // Deep Blue
const Color _secondary = Color(0xFF2E7D32); // Forest Green
const Color _success = Color(0xFF2E7D32); // Success/Green
const Color _danger = Color(0xFFDD3E3E); // Error/Red
const Color _surface = Color(0xFFFAFAFA); // Light surface
const Color _bg = Color(0xFFFFFFFF); // White background
const Color _textDark = Color(0xFF212121); // Dark text
const Color _textMedium = Color(0xFF616161); // Medium text

final TextTheme _textThemeLightMode = TextTheme(
  displayLarge: const TextStyle(
      fontSize: 34, fontWeight: FontWeight.bold, color: _textDark),
  headlineMedium: const TextStyle(
      fontSize: 24, fontWeight: FontWeight.w700, color: _textDark),
  headlineSmall: const TextStyle(
      fontSize: 20, fontWeight: FontWeight.w700, color: _textDark),
  titleLarge: const TextStyle(
      fontSize: 18, fontWeight: FontWeight.w600, color: _textDark),
  titleMedium: const TextStyle(
      fontSize: 16, fontWeight: FontWeight.w600, color: _textDark),
  titleSmall: const TextStyle(
      fontSize: 14, fontWeight: FontWeight.w600, color: _textDark),
  bodyLarge: const TextStyle(fontSize: 16, color: _textMedium),
  bodyMedium: const TextStyle(fontSize: 14, color: _textMedium),
  bodySmall: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E)),
  labelLarge: const TextStyle(
      fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
);

final TextTheme _textThemeDarkMode = TextTheme(
  displayLarge: const TextStyle(
      fontSize: 34, fontWeight: FontWeight.bold, color: Colors.white),
  headlineMedium: const TextStyle(
      fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
  headlineSmall: const TextStyle(
      fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
  titleLarge: const TextStyle(
      fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
  titleMedium: const TextStyle(
      fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
  titleSmall: const TextStyle(
      fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
  bodyLarge: const TextStyle(fontSize: 16, color: Color(0xFFE0E0E0)),
  bodyMedium: const TextStyle(fontSize: 14, color: Color(0xFFD0D0D0)),
  bodySmall: const TextStyle(fontSize: 12, color: Color(0xFFC0C0C0)),
  labelLarge: const TextStyle(
      fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
);

final ThemeData appLightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  scaffoldBackgroundColor: _bg,
  colorScheme: ColorScheme.fromSeed(
    seedColor: _primary,
    brightness: Brightness.light,
    primary: _primary,
    onPrimary: Colors.white,
    secondary: _secondary,
    tertiary: Color(0xFFFFC107),
    background: _bg,
    surface: _surface,
    error: _danger,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: _primary,
    foregroundColor: Colors.white,
    centerTitle: true,
    elevation: 0,
    titleTextStyle: TextStyle(
      color: Colors.white,
      fontSize: 18,
      fontWeight: FontWeight.w600,
    ),
  ),
  cardTheme: CardThemeData(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 2,
    color: Colors.white,
    margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: _primary,
      foregroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      elevation: 2,
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: _primary,
      side: const BorderSide(color: _primary, width: 1.5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: _surface,
    contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(12)),
      borderSide: BorderSide(color: _primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: _danger, width: 1),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: _danger, width: 2),
    ),
    hintStyle: const TextStyle(color: Colors.black54, fontSize: 14),
    labelStyle: const TextStyle(color: _textDark, fontWeight: FontWeight.w500),
    prefixIconColor: _primary,
  ),
  textSelectionTheme: const TextSelectionThemeData(
    cursorColor: Colors.black,
    selectionColor: Color(0x1F0D47A1),
    selectionHandleColor: _primary,
  ),
  textTheme: _textThemeLightMode,
  visualDensity: VisualDensity.adaptivePlatformDensity,
);

final ThemeData appDarkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF121212),
  colorScheme: ColorScheme.fromSeed(
    seedColor: _primary,
    brightness: Brightness.dark,
    primary: _primary,
    onPrimary: Colors.white,
    secondary: _secondary,
    tertiary: Color(0xFFFFC107),
    background: const Color(0xFF121212),
    surface: const Color(0xFF1E1E1E),
    error: _danger,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF1E1E1E),
    foregroundColor: Colors.white,
    centerTitle: true,
    elevation: 0,
    titleTextStyle: TextStyle(
      color: Colors.white,
      fontSize: 18,
      fontWeight: FontWeight.w600,
    ),
  ),
  cardTheme: CardThemeData(
    color: const Color(0xFF1E1E1E),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 2,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: _primary,
      foregroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      elevation: 2,
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFF2A2A2A),
    contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade700),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade700),
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(12)),
      borderSide: BorderSide(color: _primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: _danger, width: 1),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: _danger, width: 2),
    ),
    hintStyle: const TextStyle(color: Colors.white70),
    labelStyle:
        const TextStyle(color: Colors.white70, fontWeight: FontWeight.w500),
    prefixIconColor: _primary,
  ),
  textSelectionTheme: const TextSelectionThemeData(
    cursorColor: Colors.white,
    selectionColor: Color(0x1F0D47A1),
    selectionHandleColor: _primary,
  ),
  textTheme: _textThemeDarkMode,
  visualDensity: VisualDensity.adaptivePlatformDensity,
);
