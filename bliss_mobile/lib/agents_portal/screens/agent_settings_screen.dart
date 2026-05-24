import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/colors.dart';
import '../constants/styles.dart';

class AgentSettingsScreen extends StatefulWidget {
  final String agentId;
  const AgentSettingsScreen({super.key, required this.agentId});

  @override
  State<AgentSettingsScreen> createState() => _AgentSettingsScreenState();
}

class _AgentSettingsScreenState extends State<AgentSettingsScreen> {
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _companyController = TextEditingController();
  bool _loading = true;
  bool _notificationsEnabled = true;
  bool _emailAlertsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final response = await http.post(
        Uri.parse('https://backened-server.onrender.com/getAgentSettings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'agentId': widget.agentId}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['settings'] != null) {
          final settings = data['settings'];
          setState(() {
            _emailController.text = settings['email'] ?? '';
            _phoneController.text = settings['phone'] ?? '';
            _companyController.text = settings['companyName'] ?? '';
            _notificationsEnabled = settings['notificationsEnabled'] ?? true;
            _emailAlertsEnabled = settings['emailAlertsEnabled'] ?? true;
            _loading = false;
          });
          return;
        }
      }
    } catch (e) {
      debugPrint('Error loading settings: $e');
    }
    setState(() => _loading = false);
  }

  Future<void> _saveSettings() async {
    try {
      final response = await http.post(
        Uri.parse('https://backened-server.onrender.com/updateAgentSettings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'agentId': widget.agentId,
          'email': _emailController.text.trim(),
          'phone': _phoneController.text.trim(),
          'companyName': _companyController.text.trim(),
          'notificationsEnabled': _notificationsEnabled,
          'emailAlertsEnabled': _emailAlertsEnabled,
        }),
      );

      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings saved successfully')),
          );
          return;
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving settings: ${response.body}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving settings: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppColors.primary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Account Settings Section
            const Text(
              'Account Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),

            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                  )
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailController,
                        decoration: AppStyles.inputDecoration('Email').copyWith(
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87, fontSize: 16),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _phoneController,
                        decoration: AppStyles.inputDecoration('Phone').copyWith(
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87, fontSize: 16),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _companyController,
                        decoration: AppStyles.inputDecoration('Company Name').copyWith(
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87, fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Notification Settings Section
            const Text(
              'Notification Preferences',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),

            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                  )
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Column(
                  children: [
                    SwitchListTile(
                      tileColor: Colors.white,
                      title: const Text('Push Notifications'),
                      subtitle: const Text('Receive push notifications on your device'),
                      value: _notificationsEnabled,
                      onChanged: (value) {
                        setState(() => _notificationsEnabled = value);
                      },
                    ),
                    const Divider(height: 0),
                    SwitchListTile(
                      tileColor: Colors.white,
                      title: const Text('Email Alerts'),
                      subtitle: const Text('Receive email notifications'),
                      value: _emailAlertsEnabled,
                      onChanged: (value) {
                        setState(() => _emailAlertsEnabled = value);
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Save Button
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                  )
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saveSettings,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Save Settings',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _companyController.dispose();
    super.dispose();
  }
}
