import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../services/backend_auth.dart';
import '../../services/backend_register_service.dart';
import '../../widgets/logo.dart';
import '../../services/activity_log_service.dart';
import '../../models/user_role.dart';

class EmployerLoginScreen extends StatefulWidget {
  const EmployerLoginScreen({super.key});

  @override
  State<EmployerLoginScreen> createState() => _EmployerLoginScreenState();
}

class _EmployerLoginScreenState extends State<EmployerLoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _passwordVisible = false;

  Future<void> _loginWithEmail() async {
    setState(() => _loading = true);
    try {
      if (_emailController.text.trim() == 'boss' &&
          _passwordController.text.trim() == 'boss123') {
        // Log boss login
        await ActivityLogService.log(
          type: 'login',
          actorId: 'boss',
          actorRole: UserRole.admin.value,
          description: 'Boss admin logged in',
          details: {'email': 'boss'},
        );
        Navigator.pushReplacementNamed(context, '/employersPortal', arguments: {
          'employerId': 'boss',
          'employerName': 'Boss Admin',
          'companyName': 'Bliss Recruitment',
        });
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

      try {
        BackendAuth.setSession(id: backendId, authToken: res.code);
      } catch (_) {}

      // Log employer login
      await ActivityLogService.log(
        type: 'login',
        actorId: backendId,
        actorRole: UserRole.employer.value,
        description: 'Employer logged in',
        details: {'email': _emailController.text.trim()},
      );

      Navigator.pushReplacementNamed(context, '/employersPortal', arguments: {
        'employerId': backendId,
        'employerName': 'Employer',
        'companyName': 'Your Company',
      });
    } catch (e) {
      final message = e.toString();
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loginWithGoogle() async {
    setState(() => _loading = true);
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return;

      final existing =
          await BackendRegisterService.getUserByEmail(googleUser.email);
      String backendId;
      if (existing.success && existing.id != null) {
        backendId = existing.id!.toString();
      } else {
        final res = await BackendRegisterService.register(
          name: googleUser.displayName ?? '',
          email: googleUser.email,
          extra: {'provider': 'google'},
        );
        backendId = res.id?.toString() ?? '0';
      }

      Navigator.pushReplacementNamed(context, '/employersPortal', arguments: {
        'employerId': backendId,
        'employerName': googleUser.displayName ?? 'Employer',
        'companyName': 'Your Company',
      });
    } catch (e) {
      const message = 'Google sign-in failed. Please try again.';
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text(message)));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

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
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo and Header
                const Logo(height: 56, width: 56),
                const SizedBox(height: 14),
                Text(
                  'Bliss Employer Portal',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Connect with top global talent',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),

                // Card with form
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Welcome Back',
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          enabled: !_loading,
                          decoration: InputDecoration(
                            labelText: 'Email Address',
                            prefixIcon: const Icon(Icons.email),
                            hintText: 'your.email@company.com',
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
                        const SizedBox(height: 22),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _loginWithEmail,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: _loading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                      ),
                                    )
                                  : const Text('Login',
                                      style: TextStyle(fontSize: 16)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(children: [
                          Expanded(child: Divider(color: Colors.grey.shade300)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('or',
                                style: theme.textTheme.bodyMedium
                                    ?.copyWith(color: Colors.grey.shade500)),
                          ),
                          Expanded(child: Divider(color: Colors.grey.shade300)),
                        ]),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account?",
                        style: theme.textTheme.bodyMedium),
                    TextButton(
                      onPressed: () =>
                          Navigator.pushNamed(context, '/employer-signup'),
                      child: Text(' Sign up',
                          style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w600)),
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
