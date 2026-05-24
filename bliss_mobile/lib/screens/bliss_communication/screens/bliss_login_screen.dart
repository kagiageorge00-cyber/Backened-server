import 'package:flutter/material.dart';
import '../../../services/backend_register_service.dart';
import '../../../services/backend_auth.dart';
import '../../../services/activity_log_service.dart';
import '../../../models/user_role.dart';

const String kLoaderRoute = '/blissLoader';

class BlissLoginScreen extends StatefulWidget {
  const BlissLoginScreen({super.key});

  @override
  State<BlissLoginScreen> createState() => _BlissLoginScreenState();
}

class _BlissLoginScreenState extends State<BlissLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  // backend-only auth

  String email = '';
  String password = '';
  bool _isLoading = false;

  Future<void> login() async {
    if (_isLoading) return;
    if (!_formKey.currentState!.validate()) return;

    _formKey.currentState!.save();
    setState(() => _isLoading = true);

    try {
      // Check if it's boss credentials first
      if (email.trim().toLowerCase() == 'boss' &&
          password.trim() == 'boss123') {
        // Log boss login
        await ActivityLogService.log(
          type: 'login',
          actorId: 'boss',
          actorRole: UserRole.admin.value,
          description: 'Boss admin logged in (bliss communication)',
          details: {'email': 'boss'},
        );
        if (mounted) {
          Navigator.pushReplacementNamed(context, kLoaderRoute);
        }
        return;
      }

      final res = await BackendRegisterService.login(
          email: email.trim().toLowerCase(), password: password.trim());
      if (!res.success || res.id == null) {
        throw Exception(res.error ?? 'Login failed');
      }
      BackendAuth.setSession(id: res.id!.toString(), authToken: res.code);

      // Log user login
      await ActivityLogService.log(
        type: 'login',
        actorId: res.id!.toString(),
        actorRole: UserRole.candidate.value,
        description: 'User logged in (bliss communication)',
        details: {'email': email.trim().toLowerCase()},
      );

      if (mounted) Navigator.pushReplacementNamed(context, kLoaderRoute);
    } catch (e) {
      String message = e.toString();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blueGrey.shade50,
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: ListView(
                children: [
                  const SizedBox(height: 120),
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Email',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 2),
                      ),
                    ),
                    style: const TextStyle(color: Colors.black87, fontSize: 16),
                    validator: (value) => value == null || value.isEmpty
                        ? 'Enter your email'
                        : null,
                    onSaved: (value) => email = value!.trim(),
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Password',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 2),
                      ),
                    ),
                    style: const TextStyle(color: Colors.black87, fontSize: 16),
                    obscureText: true,
                    validator: (value) => value == null || value.length < 6
                        ? 'Min 6 characters'
                        : null,
                    onSaved: (value) => password = value!.trim(),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: _isLoading ? null : login,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      backgroundColor: Colors.blue.shade700,
                    ),
                    child: const Text(
                      'Login',
                      style: TextStyle(fontSize: 18),
                    ),
                  ),
                  TextButton(
                    onPressed: _isLoading
                        ? null
                        : () => Navigator.pushNamed(
                              context,
                              '/blissSignup',
                            ),
                    child: const Text("Don't have an account? Sign Up"),
                  ),
                ],
              ),
            ),
          ),

          // Loading Overlay
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.35),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
