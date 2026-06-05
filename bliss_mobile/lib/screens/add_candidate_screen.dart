import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class AddCandidateScreen extends StatefulWidget {
  const AddCandidateScreen({super.key});

  @override
  State<AddCandidateScreen> createState() => _AddCandidateScreenState();
}

class _AddCandidateScreenState extends State<AddCandidateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _countryController = TextEditingController();
  final _skillsController = TextEditingController();
  final _experienceController = TextEditingController();
  final _emailController = TextEditingController();
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _message = null;
    });

    try {
      final response = await http.post(
        Uri.parse('${AppConfig.backendUrl}/api/candidates'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fullName': _fullNameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'country': _countryController.text.trim(),
          'skills': _skillsController.text.trim(),
          'experience': _experienceController.text.trim(),
          'email': _emailController.text.trim(),
        }),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          body['success'] == true) {
        setState(() => _message = 'Candidate created successfully.');
        _formKey.currentState!.reset();
      } else {
        setState(
            () => _message = body['error'] ?? 'Unable to create candidate.');
      }
    } catch (e) {
      setState(() => _message = 'Network error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _countryController.dispose();
    _skillsController.dispose();
    _experienceController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Candidate')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                  controller: _fullNameController,
                  decoration: const InputDecoration(labelText: 'Full Name'),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Required' : null),
              TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email')),
              TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone'),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Required' : null),
              TextFormField(
                  controller: _countryController,
                  decoration: const InputDecoration(labelText: 'Country'),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Required' : null),
              TextFormField(
                  controller: _skillsController,
                  decoration: const InputDecoration(labelText: 'Skills')),
              TextFormField(
                  controller: _experienceController,
                  decoration: const InputDecoration(labelText: 'Experience')),
              const SizedBox(height: 16),
              ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const CircularProgressIndicator()
                      : const Text('Create Candidate')),
              if (_message != null) ...[
                const SizedBox(height: 12),
                Text(_message!,
                    style: TextStyle(
                        color: _message!.startsWith('Candidate')
                            ? Colors.green
                            : Colors.red)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
