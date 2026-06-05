import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/page_card_scaffold.dart';
import '../widgets/logo.dart';

class ApplyScreen extends StatefulWidget {
  const ApplyScreen({super.key});

  @override
  State<ApplyScreen> createState() => _ApplyScreenState();
}

class _ApplyScreenState extends State<ApplyScreen> {
  bool _termsAccepted = false;
  bool _openingWhatsApp = false;

  // ======================
  // ✅ FIXED WHATSAPP
  // ======================
  Future<void> _openWhatsApp() async {
    setState(() => _openingWhatsApp = true);

    try {
      final uri = Uri.parse("https://wa.me/254102084855");

      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw "Could not open WhatsApp";
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to open WhatsApp")),
      );
    } finally {
      setState(() => _openingWhatsApp = false);
    }
  }

  // ======================
  // ✅ NAVIGATION (SAFE)
  // ======================
  void _startApplication() {
    if (!_termsAccepted) return;

    Navigator.pushNamed(context, '/jobApplication');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return PageCardScaffold(
      title: 'Apply For Jobs',
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ======================
            // 🔥 BRAND HEADER
            // ======================
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 30),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    cs.primary,
                    cs.primaryContainer,
                  ],
                ),
              ),
              child: Column(
                children: [
                  const Logo(height: 90),
                  const SizedBox(height: 10),
                  const Text(
                    "Bliss Connect",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    "Connecting You To Real Jobs",
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  Text(
                    'Start Your Career Journey 🚀',
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 10),

                  const Text(
                    'Join verified candidates getting real job opportunities locally and internationally.',
                    style: TextStyle(height: 1.6),
                  ),

                  const SizedBox(height: 25),

                  // ======================
                  // TRUST CARD
                  // ======================
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.shade300),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.verified, color: Colors.green),
                            SizedBox(width: 8),
                            Text(
                              "Verified Candidate System",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        SizedBox(height: 10),
                        Text(
                          "✔ Your profile becomes visible to employers\n"
                          "✔ Verified candidates get priority placement\n"
                          "✔ Direct connection to real job opportunities",
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 25),

                  // ======================
                  // TERMS
                  // ======================
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.blue.shade50,
                          Colors.cyan.shade50,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.info_outline,
                                color: Colors.blue.shade700),
                            const SizedBox(width: 10),
                            Text(
                              "Terms & Conditions",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text("By applying you agree to:"),
                        const SizedBox(height: 8),
                        _bullet("Provide accurate information"),
                        _bullet("Be available for job communication"),
                        _bullet("Allow profile visibility to employers"),
                        _bullet("Complete verification process"),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ======================
                  // CHECKBOX
                  // ======================
                  Row(
                    children: [
                      Checkbox(
                        value: _termsAccepted,
                        onChanged: (v) =>
                            setState(() => _termsAccepted = v ?? false),
                      ),
                      const Expanded(
                        child: Text("I agree to the Terms & Conditions"),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ======================
                  // APPLY BUTTON
                  // ======================
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _termsAccepted ? _startApplication : null,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text(
                        "Start Application (Get Verified)",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ======================
                  // WHATSAPP
                  // ======================
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.chat, color: Colors.green),
                      label: _openingWhatsApp
                          ? const Text("Opening...")
                          : const Text("Talk to Support on WhatsApp"),
                      onPressed: _openingWhatsApp ? null : _openWhatsApp,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ======================
                  // SOCIAL PROOF
                  // ======================
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      "✔ Hundreds of candidates already connected to jobs\n"
                      "✔ Trusted by employers locally & abroad",
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bullet(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Text("• "),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}