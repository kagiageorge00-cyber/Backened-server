import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  bool _changingPassword = false;

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (_oldPasswordController.text.trim().isEmpty ||
        _newPasswordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fill both password fields')));
      return;
    }
    setState(() => _changingPassword = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.changePassword(
      _oldPasswordController.text.trim(),
      _newPasswordController.text.trim(),
    );
    if (!mounted) return;
    setState(() => _changingPassword = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content:
              Text(success ? 'Password updated' : 'Password change failed')),
    );
    if (success) {
      _oldPasswordController.clear();
      _newPasswordController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Settings',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Row(
            children: [
              const Text('Theme:'),
              const SizedBox(width: 16),
              DropdownButton<ThemeMode>(
                value: auth.themeMode,
                items: const [
                  DropdownMenuItem(
                      value: ThemeMode.light, child: Text('Light')),
                  DropdownMenuItem(value: ThemeMode.dark, child: Text('Dark')),
                  DropdownMenuItem(
                      value: ThemeMode.system, child: Text('System')),
                ],
                onChanged: (mode) {
                  if (mode != null) {
                    auth.setThemeMode(mode);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 32),
          const Text('Change Password',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _oldPasswordController,
            decoration: const InputDecoration(labelText: 'Current password'),
            obscureText: true,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _newPasswordController,
            decoration: const InputDecoration(labelText: 'New password'),
            obscureText: true,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _changingPassword ? null : _changePassword,
            child: _changingPassword
                ? const CircularProgressIndicator()
                : const Text('Update password'),
          ),
        ],
      ),
    );
  }
}
