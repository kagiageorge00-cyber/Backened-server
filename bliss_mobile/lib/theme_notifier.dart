import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme.dart';

class ThemeNotifier extends ChangeNotifier {
  static const _prefKey = 'isDarkMode';
  bool _isDarkMode = false;

  bool get isDarkMode => _isDarkMode;

  // Use our custom themes
  ThemeData get currentTheme => _isDarkMode ? appDarkTheme : appLightTheme;

  Future<void> loadThemeFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool(_prefKey) ?? false;
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    _isDarkMode = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, _isDarkMode);
    notifyListeners();
  }

  // Optional: toggle between light and dark
  Future<void> toggleTheme() async {
    await setDarkMode(!_isDarkMode);
  }
}
