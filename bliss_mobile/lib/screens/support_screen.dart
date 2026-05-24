import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/backend_auth.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _ticketController = TextEditingController();
  final _subjectController = TextEditingController();
  bool _submitting = false;

  Future<void> _submitTicket() async {
    if (_subjectController.text.isEmpty || _ticketController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final userId = BackendAuth.userId ?? 'anonymous';
      await FirebaseFirestore.instance.collection('tickets').add({
        'userId': userId,
        'userEmail': 'anonymous',
        'subject': _subjectController.text.trim(),
        'description': _ticketController.text.trim(),
        'status': 'open',
        'priority': 'normal',
        'createdAt': FieldValue.serverTimestamp(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ticket submitted successfully')),
      );
      _subjectController.clear();
      _ticketController.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit ticket: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  Future<void> _launchUrlString(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open link')),
      );
    }
  }

  @override
  void dispose() {
    _ticketController.dispose();
    _subjectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Support'),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? [const Color(0xFF0D132A), const Color(0xFF111B3A)]
                : [const Color(0xFFEFF4FF), Colors.white],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Contact Us',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              _contactCard(
                  'WhatsApp',
                  '+254 102 084 855',
                  Icons.message,
                  () => _launchUrlString('https://wa.me/254102084855'),
                  theme.colorScheme.primary),
              const SizedBox(height: 16),
              _contactCard(
                  'Phone',
                  '+254 798 242 350',
                  Icons.phone,
                  () => _launchUrlString('tel:+254798242350'),
                  theme.colorScheme.primary),
              const SizedBox(height: 16),
              _contactCard(
                  'Email',
                  'blssspprtteam@gmail.com',
                  Icons.email,
                  () => _launchUrlString('mailto:blssspprtteam@gmail.com'),
                  theme.colorScheme.primary),
              const SizedBox(height: 40),
              const Text('Raise a Ticket',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextField(
                controller: _subjectController,
                decoration: const InputDecoration(
                    labelText: 'Subject', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _ticketController,
                maxLines: 5,
                decoration: const InputDecoration(
                    labelText: 'Description', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submitTicket,
                  child: _submitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Submit Ticket'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _contactCard(String title, String value, IconData icon,
      VoidCallback onTap, Color iconColor) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: iconColor),
        title: Text(title),
        subtitle: Text(value),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: onTap,
      ),
    );
  }
}
