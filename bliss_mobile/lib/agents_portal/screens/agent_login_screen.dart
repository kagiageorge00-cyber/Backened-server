import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../constants/colors.dart';
import '../constants/styles.dart';
import '../models/agent_model.dart';
import 'agents_dashboard_screen.dart';
import '../services/activity_log_service.dart';
import '../models/user_role.dart';

class AgentLoginScreen extends StatefulWidget {
  const AgentLoginScreen({super.key});

  @override
  State<AgentLoginScreen> createState() => _AgentLoginScreenState();
}

class _AgentLoginScreenState extends State<AgentLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;

  final AuthService _authService = AuthService();

  // ------------------------
  // Handle Login
  // ------------------------
  Future<void> _loginAgent() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    // Check if it's boss credentials first
    if (_emailController.text.trim() == 'boss' &&
        _passwordController.text.trim() == 'boss123') {
      // Log boss login
      await ActivityLogService.log(
        type: 'login',
        actorId: 'boss',
        actorRole: UserRole.admin.value,
        description: 'Boss admin logged in (agent portal)',
        details: {'email': 'boss'},
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => AgentDashboardScreen(agentId: 'boss'),
        ),
      );
      return;
    }

    // Check for test agent credentials
    if (_emailController.text.trim() == 'agent@test.com' &&
        _passwordController.text.trim() == 'agent123') {
      // Log test agent login
      await ActivityLogService.log(
        type: 'login',
        actorId: 'test_agent',
        actorRole: UserRole.agent.value,
        description: 'Test agent logged in',
        details: {'email': 'agent@test.com'},
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => AgentDashboardScreen(agentId: 'test_agent'),
        ),
      );
      return;
    }

    final AgentModel? agent = await _authService.loginAgent(
      email: _emailController.text.trim(),
      password: _passwordController.text.trim(),
    );

    setState(() {
      _isLoading = false;
    });

    if (agent != null) {
      // Log agent login
      await ActivityLogService.log(
        type: 'login',
        actorId: agent.agentId,
        actorRole: UserRole.agent.value,
        description: 'Agent logged in',
        details: {'email': _emailController.text.trim()},
      );
      // Navigate to Agent Dashboard
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => AgentDashboardScreen(agentId: agent.agentId),
        ),
      );
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid email or password')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Image.asset(
                  'assets/images/logo.png',
                  height: 120,
                ),
                const SizedBox(height: 24),

                // Form Container with Styling
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
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          // Email Field
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration:
                                AppStyles.inputDecoration('Email').copyWith(
                              filled: true,
                              fillColor: Colors.white,
                              hintStyle: TextStyle(
                                color: Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? Colors.white70
                                    : Colors.grey[600],
                              ),
                            ),
                            style: TextStyle(
                                color: Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? Colors.white
                                    : Colors.black87,
                                fontSize: 16),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Enter your email';
                              }
                              // Allow 'boss' as special admin username
                              if (value == 'boss') return null;
                              if (!value.contains('@')) {
                                return 'Enter a valid email';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Password Field
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration:
                                AppStyles.inputDecoration('Password').copyWith(
                              filled: true,
                              fillColor: Colors.white,
                              hintStyle: TextStyle(
                                color: Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? Colors.white70
                                    : Colors.grey[600],
                              ),
                            ),
                            style: TextStyle(
                                color: Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? Colors.white
                                    : Colors.black87,
                                fontSize: 16),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Enter your password';
                              }
                              if (value.length < 6) {
                                return 'Password must be at least 6 characters';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Login Button with Shadow
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
                      onPressed: _isLoading ? null : _loginAgent,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Login',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Forgot Password
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/agentForgotPassword');
                  },
                  child: const Text('Forgot Password?'),
                ),

                // Register Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account?"),
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/agentRegister');
                      },
                      child: const Text('Register'),
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
