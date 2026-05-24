import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../../services/boss_account_service.dart';
import 'staff_portal_screen.dart';
import '../../services/activity_log_service.dart';
import '../../models/user_role.dart';

class StaffSignInScreen extends StatefulWidget {
  const StaffSignInScreen({super.key});

  @override
  State<StaffSignInScreen> createState() => _StaffSignInScreenState();
}

class _StaffSignInScreenState extends State<StaffSignInScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    // Initialize boss account in Firestore (non-blocking)
    BossAccountService.initializeBossAccount();
  }

  Future<void> _login() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter username and password')),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      if (await BossAccountService.authenticateBoss(username, password)) {
        // Log boss/staff login
        await ActivityLogService.log(
          type: 'login',
          actorId: username,
          actorRole: username == 'boss' ? UserRole.admin.value : UserRole.staff.value,
          description: username == 'boss' ? 'Boss admin logged in (staff portal)' : 'Staff logged in',
          details: {'username': username},
        );
        // Successful login
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => StaffPortalScreen(
              role: username,
              displayName: username == 'boss' ? 'Boss' : username,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid username or password')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Staff Login'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _usernameController,
              decoration: InputDecoration(
                labelText: 'Username',
                prefixIcon: const Icon(Icons.person),
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
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: const TextStyle(color: Colors.black87, fontSize: 16),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Password',
                prefixIcon: const Icon(Icons.lock),
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
                  borderSide: const BorderSide(color: Colors.blue, width: 2),
                ),
              ),
              style: const TextStyle(color: Colors.black87, fontSize: 16),
            ),
            const SizedBox(height: 24),
            isLoading
                ? const CircularProgressIndicator()
                : ElevatedButton(
                    onPressed: _login,
                    child: const Text('Login'),
                  ),
          ],
        ),
      ),
    );
  }
}
