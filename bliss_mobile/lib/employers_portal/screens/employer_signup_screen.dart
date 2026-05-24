import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
// Using backend-only auth: do not create Firebase users here.
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

  String _accountType = 'Individual'; // default
  bool _loading = false;

  Future<void> _signUpWithEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final res = await BackendRegisterService.register(
        name: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        extra: {
          'companyName': _companyNameController.text.trim(),
          'whatsappNumber': _whatsappController.text.trim(),
          'country': _countryController.text.trim(),
          'accountType': _accountType,
        },
      );

      if (!res.success || res.id == null) {
        final msg = res.error ?? 'Registration failed';
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(msg)));
        return;
      }

      final backendId = res.id!.toString();

      await FirebaseFirestore.instance
          .collection('employers')
          .doc(backendId)
          .set({
        'fullName': _fullNameController.text.trim(),
        'companyName': _companyNameController.text.trim(),
        'email': _emailController.text.trim(),
        'whatsappNumber': _whatsappController.text.trim(),
        'country': _countryController.text.trim(),
        'accountType': _accountType,
        'backendId': backendId,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // set backend session
      BackendAuth.setSession(id: backendId);

      Navigator.pushReplacementNamed(context, '/employersPortal', arguments: {
        'employerId': backendId,
        'employerName': _fullNameController.text.trim(),
        'companyName': _companyNameController.text.trim(),
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _signUpWithGoogle() async {
    setState(() => _loading = true);
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        clientId:
            '547511206892-53ecc5e187584427b4b6c9.apps.googleusercontent.com',
      );
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return;

      // Try to find existing user by email
      final existing =
          await BackendRegisterService.getUserByEmail(googleUser.email);
      int? employerId;
      if (existing.success && existing.id != null) {
        employerId = existing.id;
      } else {
        final res = await BackendRegisterService.register(
          name: googleUser.displayName ?? '',
          email: googleUser.email,
          extra: {'companyName': '', 'accountType': _accountType},
        );
        if (res.success) employerId = res.id;
      }
      final backendId = employerId?.toString() ??
          (await BackendRegisterService.register(
                  name: googleUser.displayName ?? '',
                  email: googleUser.email,
                  extra: {'companyName': '', 'accountType': _accountType}))
              .id
              ?.toString() ??
          '0';

      await FirebaseFirestore.instance
          .collection('employers')
          .doc(backendId)
          .set({
        'fullName': googleUser.displayName ?? '',
        'companyName': '',
        'email': googleUser.email,
        'whatsappNumber': '',
        'country': '',
        'accountType': _accountType,
        'backendId': backendId,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // set backend session
      BackendAuth.setSession(id: backendId);

      Navigator.pushReplacementNamed(context, '/employersPortal', arguments: {
        'employerId': backendId,
        'employerName': googleUser.displayName ?? '',
        'companyName': '',
      });
    } catch (e) {
      String message = 'Google sign-up failed. Please try again.';
      if (e.toString().contains('network')) {
        message = 'Network error. Please check your internet connection.';
      } else if (e.toString().contains('cancelled')) {
        message = 'Google sign-in was cancelled.';
      }
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
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
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 600),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _fullNameController,
                        enabled: !_loading,
                        decoration: InputDecoration(
                          labelText: 'Full Name',
                          hintText: 'John Doe',
                          prefixIcon: const Icon(Icons.person),
                        ),
                        style: theme.textTheme.bodyLarge,
                        validator: (val) =>
                            val!.isEmpty ? 'Enter your full name' : null,
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _companyNameController,
                        enabled: !_loading,
                        decoration: InputDecoration(
                          labelText: 'Company Name',
                          hintText: 'Your Company Inc.',
                          prefixIcon: const Icon(Icons.business),
                        ),
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 18),
                      DropdownButtonFormField<String>(
                        initialValue: _accountType,
                        decoration: InputDecoration(
                          labelText: 'Account Type',
                          prefixIcon: const Icon(Icons.account_balance),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'Individual',
                            child: Text('Individual'),
                          ),
                          DropdownMenuItem(
                            value: 'Company',
                            child: Text('Company'),
                          ),
                        ],
                        onChanged: (val) => setState(() => _accountType = val!),
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _emailController,
                        enabled: !_loading,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'Email Address',
                          hintText: 'your.email@company.com',
                          prefixIcon: const Icon(Icons.email),
                        ),
                        style: theme.textTheme.bodyLarge,
                        validator: (val) =>
                            val!.isEmpty ? 'Enter your email' : null,
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _passwordController,
                        enabled: !_loading,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          hintText: 'Min 6 characters',
                          prefixIcon: const Icon(Icons.lock),
                        ),
                        style: theme.textTheme.bodyLarge,
                        validator: (val) => val!.length < 6
                            ? 'Password too short (min 6)'
                            : null,
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _whatsappController,
                        enabled: !_loading,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: 'WhatsApp Number',
                          hintText: '+1 234 567 8900',
                          prefixIcon: const Icon(Icons.phone),
                        ),
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _countryController,
                        enabled: !_loading,
                        decoration: InputDecoration(
                          labelText: 'Country of Residence',
                          hintText: 'Nigeria, USA, etc.',
                          prefixIcon: const Icon(Icons.public),
                        ),
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 28),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _signUpWithEmail,
                          child: const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Text(
                              'Finish Sign Up',
                              style: TextStyle(fontSize: 16),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _loading ? null : _signUpWithGoogle,
                          icon: const Icon(Icons.login),
                          label: const Text('Sign Up with Google'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Already have an account? ',
                            style: theme.textTheme.bodyMedium,
                          ),
                          TextButton(
                            onPressed: () =>
                                Navigator.pushNamed(context, '/employer-login'),
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                            ),
                            child: Text(
                              'Login',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
