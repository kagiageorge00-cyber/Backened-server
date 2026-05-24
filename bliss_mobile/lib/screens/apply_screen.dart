import 'package:flutter/material.dart';
import '../widgets/page_card_scaffold.dart';

class ApplyScreen extends StatefulWidget {
  const ApplyScreen({super.key});

  @override
  State<ApplyScreen> createState() => _ApplyScreenState();
}

class _ApplyScreenState extends State<ApplyScreen> {
  bool _termsAccepted = false;

  @override
  Widget build(BuildContext context) {
    return PageCardScaffold(
      title: 'Apply For Jobs',
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Start Your Career Journey',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(height: 10),
            Text(
              'Join thousands of professionals who found their dream jobs through Bliss Connect. Fill in your details to get started.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.6,
                  ),
            ),
            const SizedBox(height: 30),
            // Terms & Policies Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.blue.shade50,
                    Colors.cyan.shade50,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.blue.shade200,
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Colors.blue.shade700,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Important Terms & Conditions',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue.shade700,
                                ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'By proceeding with your application, you agree to:',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 8),
                  _buildBulletPoint(
                      'Provide accurate and truthful information'),
                  _buildBulletPoint(
                      'Comply with all local and international laws'),
                  _buildBulletPoint(
                      'Share your data for recruitment and visa processing'),
                  _buildBulletPoint('Respond to communication within 7 days'),
                  _buildBulletPoint(
                      'Pay required processing fees (if applicable)'),
                  const SizedBox(height: 12),
                  Text(
                    'Please review our full Terms & Policies before applying.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontStyle: FontStyle.italic,
                          color: Colors.grey.shade700,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Checkbox for Terms Acceptance
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  setState(() {
                    _termsAccepted = !_termsAccepted;
                  });
                },
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 2),
                        child: Checkbox(
                          value: _termsAccepted,
                          onChanged: (value) {
                            setState(() {
                              _termsAccepted = value ?? false;
                            });
                          },
                          activeColor: Colors.green.shade600,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            text: 'I have read and agree to the ',
                            style: Theme.of(context).textTheme.bodyMedium,
                            children: [
                              TextSpan(
                                text: 'Terms & Policies',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: Colors.blue.shade700,
                                      fontWeight: FontWeight.bold,
                                      decoration: TextDecoration.underline,
                                    ),
                              ),
                              const TextSpan(
                                text:
                                    ' and confirm that all information I provide is accurate and truthful.',
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
            // Start Application Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: _termsAccepted
                      ? Theme.of(context).colorScheme.primary
                      : Colors.grey.shade400,
                  disabledBackgroundColor: Colors.grey.shade400,
                ),
                onPressed: _termsAccepted
                    ? () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text(
                              '✓ Terms accepted. Starting your application...',
                              style: TextStyle(color: Colors.white),
                            ),
                            backgroundColor: Colors.green.shade600,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                        Navigator.pushNamed(context, '/jobApplication');
                      }
                    : null,
                child: Text(
                  _termsAccepted
                      ? 'Start Application Now'
                      : 'Accept Terms to Continue',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _termsAccepted ? Colors.white : Colors.grey.shade700,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // View Full Terms Link
            Center(
              child: TextButton(
                onPressed: () => _showFullTermsAndPolicies(context),
                child: Text(
                  'View Full Terms & Policies',
                  style: TextStyle(
                    color: Colors.blue.shade700,
                    fontWeight: FontWeight.w600,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 6, right: 10),
            child: Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    height: 1.5,
                    color: Colors.grey.shade700,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFullTermsAndPolicies(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Bliss Connect - Full Terms & Policies'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView(
              shrinkWrap: true,
              children: [
                _buildTermsSection(
                  context,
                  '1. Application Authenticity & Accuracy',
                  'You certify that all information provided in your application is true, complete, and accurate. You understand that providing false, misleading, or fraudulent information may result in immediate disqualification, legal action, and blacklisting from our platform.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '2. Data Privacy & Information Protection',
                  'Bliss Connect collects and processes your personal information in compliance with GDPR, CCPA, and applicable international data protection laws. Your data is encrypted and not shared with third parties without your consent.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '3. Application Processing & Communication',
                  'You authorize Bliss Connect and partner employers to contact you via email, phone, SMS, or video call. Processing times vary (5-30 business days). Failure to respond within 7 days may result in application cancellation.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '4. Visa & Travel Requirements',
                  'For international positions, you confirm eligibility and will provide all required documentation. Bliss Connect provides guidance but does not guarantee visa approval. Visa denial is not grounds for fee refund.',
                ),
                const SizedBox(height: 12),
                _buildTermsSection(
                  context,
                  '5. Processing Fees & Payments',
                  'Processing fees (10-15% of first month salary) are non-refundable unless the employer cancels. Payment accepted via M-Pesa, bank transfer, or credit card.',
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTermsSection(
      BuildContext context, String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.blue.shade700,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          content,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                height: 1.5,
                color: Colors.grey.shade700,
              ),
          textAlign: TextAlign.justify,
        ),
      ],
    );
  }
}
