import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../services/backend_register_service.dart';
import '../../services/backend_auth.dart';

class EmployerSignUpScreen extends StatefulWidget {
  const EmployerSignUpScreen({super.key});

  @override
  State<EmployerSignUpScreen> createState() => _EmployerSignUpScreenState();
}

class _EmployerSignUpScreenState extends State<EmployerSignUpScreen> {
  final _formKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _countryController = TextEditingController();

  final String _accountType = 'Individual';
  bool _loading = false;

  /// ✅ EMAIL SIGN UP (BACKEND ONLY)
  Future<void> _signUpWithEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final res = await BackendRegisterService.register(
        name: _fullNameController.text.trim(),
        phone: _whatsappController.text.trim(), // REQUIRED
        userType: 'employer', // REQUIRED
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        extra: {
          'companyName': _companyNameController.text.trim(),
          'country': _countryController.text.trim(),
          'accountType': _accountType,
        },
      );

      if (!res.success || res.id == null) {
        throw Exception(res.error ?? 'Registration failed');
      }

      final backendId = res.id!.toString();

      // ✅ SET SESSION ONLY
      await BackendAuth.setSession(id: backendId);

      Navigator.pushReplacementNamed(
        context,
        '/employersPortal',
        arguments: {
          'employerId': backendId,
          'employerName': _fullNameController.text.trim(),
          'companyName': _companyNameController.text.trim(),
        },
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  /// ✅ GOOGLE SIGN UP (BACKEND ONLY)
  Future<void> _signUpWithGoogle() async {
    setState(() => _loading = true);

    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) return;

      // check existing user
      final existing =
          await BackendRegisterService.getUserByEmail(googleUser.email);

      int? userId;

      if (existing.success && existing.id != null) {
        userId = existing.id;
      } else {
        final res = await BackendRegisterService.register(
          name: googleUser.displayName ?? '',
          phone: '', // optional
          userType: 'employer',
          email: googleUser.email,
          extra: {
            'companyName': '',
            'accountType': _accountType,
          },
        );

        if (!res.success || res.id == null) {
          throw Exception(res.error ?? 'Google signup failed');
        }

        userId = res.id;
      }

      final backendId = userId.toString();

      await BackendAuth.setSession(id: backendId);

      Navigator.pushReplacementNamed(
        context,
        '/employersPortal',
        arguments: {
          'employerId': backendId,
          'employerName': googleUser.displayName ?? '',
          'companyName': '',
        },
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Google sign-up failed')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _companyNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _whatsappController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Logo(height: 40, width: 40),
            const SizedBox(width: 12),
            Text(
              'Employer Sign Up',
              style: theme.textTheme.titleLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    _buildField(_fullNameController, 'Full Name', Icons.person),
                    _buildField(
                        _companyNameController, 'Company Name', Icons.business),
                    _buildField(_emailController, 'Email', Icons.email),
                    _buildField(_passwordController, 'Password', Icons.lock,
                        obscure: true),
                    _buildField(_whatsappController, 'WhatsApp', Icons.phone),
                    _buildField(_countryController, 'Country', Icons.public),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _loading ? null : _signUpWithEmail,
                      child: const Text('Finish Sign Up'),
                    ),
                    OutlinedButton(
                      onPressed: _loading ? null : _signUpWithGoogle,
                      child: const Text('Sign Up with Google'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildField(TextEditingController c, String label, IconData icon,
      {bool obscure = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: c,
        obscureText: obscure,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
        ),
        validator: (v) => v == null || v.isEmpty ? 'Required' : null,
      ),
    );
  }
}
