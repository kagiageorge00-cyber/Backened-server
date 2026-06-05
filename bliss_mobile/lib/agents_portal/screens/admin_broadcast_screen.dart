import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';
import '../constants/colors.dart';

class AdminBroadcastScreen extends StatefulWidget {
  const AdminBroadcastScreen({super.key});

  @override
  State<AdminBroadcastScreen> createState() => _AdminBroadcastScreenState();
}

class _AdminBroadcastScreenState extends State<AdminBroadcastScreen> {
  String _audience = 'all';
  final TextEditingController _controller = TextEditingController();
  String _preview = '';
  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Broadcast Message'),
        backgroundColor: AppColors.primary,
      ),
      backgroundColor: AppColors.background,
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Audience:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            DropdownButtonFormField<String>(
              initialValue: _audience,
              decoration: InputDecoration(
                labelText: 'Audience',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: AppColors.surface,
              ),
              items: const [
                DropdownMenuItem(
                    value: 'candidates', child: Text('Candidates')),
                DropdownMenuItem(value: 'employers', child: Text('Employers')),
                DropdownMenuItem(value: 'agents', child: Text('Agents')),
                DropdownMenuItem(value: 'all', child: Text('All users')),
              ],
              onChanged: (value) => setState(() => _audience = value ?? 'all'),
            ),
            const SizedBox(height: 20),
            const Text('Message:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            TextField(
              controller: _controller,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Type your message...',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                fillColor: AppColors.surface,
                filled: true,
              ),
              onChanged: (val) => setState(() => _preview = val),
            ),
            const SizedBox(height: 20),
            const Text('Preview:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(top: 8, bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(_preview, style: const TextStyle(fontSize: 16)),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _sending
                    ? null
                    : () async {
                        final message = _controller.text.trim();
                        if (message.isEmpty) return;
                        setState(() => _sending = true);
                        try {
                          debugPrint(
                              'Broadcast POST → ${AppConfig.backendUrl}/api/bulk-message');
                          final response = await http.post(
                            Uri.parse(
                                '${AppConfig.backendUrl}/api/bulk-message'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'userType': _audience == 'all'
                                  ? 'all'
                                  : _audience.substring(
                                      0, _audience.length - 1),
                              'message': message,
                            }),
                          );
                          if (response.statusCode == 200) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Message sent!')),
                              );
                            }
                          } else {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                    content:
                                        Text('Failed: \\${response.body}')),
                              );
                            }
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text('Error: \\${e.toString()}')),
                            );
                          }
                        }
                        setState(() => _sending = false);
                      },
                child: _sending
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Text('Send', style: TextStyle(fontSize: 18)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
