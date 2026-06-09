import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../services/backend_auth.dart';
import '../../services/backend_register_service.dart';
import '../../services/activity_log_service.dart';
import '../../models/user_role.dart';
import '../../widgets/logo.dart';

class EmployerLoginScreen extends StatefulWidget {
  const EmployerLoginScreen({super.key});

  @override
  State<EmployerLoginScreen> createState() => _EmployerLoginScreenState();
}

class _EmployerLoginScreenState extends State<EmployerLoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String? _returnRoute;
  Map<String, dynamic>? _returnArgs;
  bool _loading = false;
  bool _passwordVisible = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic>) {
      _returnRoute = args['returnRoute'] as String?;
      _returnArgs = args['returnArgs'] as Map<String, dynamic>?;
    }
  }

  // ================= EMAIL LOGIN =================
  Future<void> _loginWithEmail() async {
    setState(() => _loading = true);

    try {
      // 🔥 ADMIN QUICK LOGIN
      if (_emailController.text.trim() == 'boss' &&
          _passwordController.text.trim() == 'boss123') {
        await BackendAuth.setSession(id: 'boss');

        await ActivityLogService.log(
          type: 'login',
          actorId: 'boss',
          actorRole: UserRole.admin.value,
          description: 'Boss admin logged in',
          details: {'email': 'boss'},
        );

        _goToDashboard(
          employerId: 'boss',
          employerName: 'Boss Admin',
          companyName: 'Bliss Recruitment',
        );
        return;
      }

      final res = await BackendRegisterService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      if (!res.success || res.id == null) {
        throw Exception(res.error ?? 'Login failed');
      }

      final backendId = res.id!.toString();

      final expiry = (res.expiry != null && res.expiry!.isNotEmpty)
          ? DateTime.tryParse(res.expiry!)
          : DateTime.now().add(const Duration(hours: 2));

      await BackendAuth.setSession(
        id: backendId,
        authToken: res.code,
        expiry: expiry,
      );

      await ActivityLogService.log(
        type: 'login',
        actorId: backendId,
        actorRole: UserRole.employer.value,
        description: 'Employer logged in',
        details: {'email': _emailController.text.trim()},
      );

      _goToDashboard(
        employerId: backendId,
        employerName: 'Employer',
        companyName: 'Your Company',
      );
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  // ================= GOOGLE LOGIN =================
  Future<void> _loginWithGoogle() async {
    setState(() => _loading = true);

    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) return;

      final existing =
          await BackendRegisterService.getUserByEmail(googleUser.email);

      String? userId;

      if (existing.success && existing.id != null) {
        userId = existing.id;
      } else {
        // ✅ REQUIRED phone added
        final res = await BackendRegisterService.register(
          name: googleUser.displayName ?? 'Employer',
          phone: 'N/A', // 🔥 required by backend
          userType: 'employer',
          email: googleUser.email,
          extra: {'provider': 'google'},
        );

        if (!res.success || res.id == null) {
          throw Exception(res.error ?? 'Google signup failed');
        }

        userId = res.id;
      }

      final backendId = userId.toString();

      await BackendAuth.setSession(id: backendId);

      await ActivityLogService.log(
        type: 'login',
        actorId: backendId,
        actorRole: UserRole.employer.value,
        description: 'Employer logged in (Google)',
        details: {'email': googleUser.email},
      );

      _goToDashboard(
        employerId: backendId,
        employerName: googleUser.displayName ?? 'Employer',
        companyName: 'Your Company',
      );
    } catch (e) {
      _showError('Google sign-in failed');
    } finally {
      setState(() => _loading = false);
    }
  }

  // ================= HELPERS =================
  void _goToDashboard({
    required String employerId,
    required String employerName,
    required String companyName,
  }) {
    if (_returnRoute != null && _returnRoute!.isNotEmpty) {
      Navigator.pushReplacementNamed(
        context,
        _returnRoute!,
        arguments: _returnArgs ?? {
          'candidateId': _returnArgs?['candidateId'] ?? '',
          'candidateName': _returnArgs?['candidateName'] ?? 'Candidate',
        },
      );
      return;
    }

    Navigator.pushReplacementNamed(
      context,
      '/employersPortal',
      arguments: {
        'employerId': employerId,
        'employerName': employerName,
        'companyName': companyName,
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // ================= UI =================
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              children: [
                const Logo(height: 56, width: 56),
                const SizedBox(height: 14),
                Text(
                  'Bliss Employer Portal',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 20),
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        TextField(
                          controller: _emailController,
                          enabled: !_loading,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _passwordController,
                          obscureText: !_passwordVisible,
                          enabled: !_loading,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock),
                            suffixIcon: IconButton(
                              icon: Icon(_passwordVisible
                                  ? Icons.visibility
                                  : Icons.visibility_off),
                              onPressed: () => setState(
                                  () => _passwordVisible = !_passwordVisible),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _loginWithEmail,
                            child: _loading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : const Text('Login'),
                          ),
                        ),
                        const SizedBox(height: 14),
                        OutlinedButton.icon(
                          onPressed: _loading ? null : _loginWithGoogle,
                          icon: const Icon(Icons.login),
                          label: const Text('Continue with Google'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                TextButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/employer-signup'),
                  child: const Text("Don't have an account? Sign up"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
