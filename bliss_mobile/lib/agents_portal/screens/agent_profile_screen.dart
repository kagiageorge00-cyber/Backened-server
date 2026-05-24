import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/colors.dart';
import '../constants/styles.dart';

class AgentProfileScreen extends StatefulWidget {
  final String agentId;
  const AgentProfileScreen({super.key, required this.agentId});

  @override
  State<AgentProfileScreen> createState() => _AgentProfileScreenState();
}

class _AgentProfileScreenState extends State<AgentProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/getAgentProfile'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"agentId": widget.agentId}),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['profile'] != null) {
        _nameController.text = data['profile']['name'] ?? '';
        _emailController.text = data['profile']['email'] ?? '';
      }
    }
    setState(() {
      _loading = false;
    });
  }

  Future<void> _updateProfile() async {
    if (_nameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Name and email cannot be empty')));
      return;
    }
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/updateAgentProfile'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        "agentId": widget.agentId,
        "name": _nameController.text.trim(),
        "email": _emailController.text.trim(),
      }),
    );
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    Navigator.of(context).pop();
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Profile updated')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(data['error'] ?? data['message'] ?? 'Update failed')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        backgroundColor: AppColors.primary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            children: [
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
                          controller: _nameController,
                          decoration:
                              AppStyles.inputDecoration('Full Name').copyWith(
                            filled: true,
                            fillColor: Colors.white,
                          ),
                          style: const TextStyle(
                              color: AppColors.textPrimary, fontSize: 16),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _emailController,
                          decoration:
                              AppStyles.inputDecoration('Email').copyWith(
                            filled: true,
                            fillColor: Colors.white,
                          ),
                          style: const TextStyle(
                              color: AppColors.textPrimary, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
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
                    onPressed: _updateProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Update Profile',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
