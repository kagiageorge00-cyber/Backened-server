import 'dart:io';
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:bliss_mobile/widgets/payment_helper.dart';

class BirthCertificateScreen extends StatefulWidget {
  const BirthCertificateScreen({super.key});
  static const routeName = '/birth';

  @override
  State<BirthCertificateScreen> createState() => _BirthCertificateScreenState();
}

class _BirthCertificateScreenState extends State<BirthCertificateScreen> {
  File? originalId;
  File? parentIdOrDeath;
  final TextEditingController mobileController = TextEditingController();
  String status = 'Draft';
  String applicationType = 'first_time'; // 'first_time' or 'lost'
  Color get _brandColor => Colors.deepOrangeAccent;

  void _selectApplicationType(String type) {
    setState(() {
      applicationType = type;
    });
  }

  int _getCompletionPercentage() {
    int count = 0;
    if (originalId != null) count++;
    if (parentIdOrDeath != null) count++;
    if (mobileController.text.trim().isNotEmpty) count++;
    return ((count / 3) * 100).round();
  }

  Future<void> _payAndSubmit() async {
    if (originalId == null || parentIdOrDeath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please upload all required documents")),
      );
      return;
    }

    if (mobileController.text.trim().length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid mobile number')),
      );
      return;
    }

    double amount = applicationType == 'first_time' ? 7000.0 : 3000.0;

    setState(() {
      status = 'Processing payment...';
    });

    try {
      final paid = await showUnifiedPaymentDialog(
        context,
        payerName: 'Applicant',
        payerPhone: mobileController.text.trim(),
        amount: amount,
        title: 'Birth Certificate Fee',
      );

      if (paid) {
        setState(() {
          status = 'Payment received • Submitted';
        });

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Application Submitted'),
            content: const Text(
                'Birth certificate request submitted successfully. Our team will reach out to you to continue the application.'),
            actions: [
              TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('OK'))
            ],
          ),
        );
      } else {
        setState(() {
          status = 'Payment not completed';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment was not completed.')),
        );
      }
    } catch (e) {
      setState(() {
        status = 'Payment failed';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Payment failed: $e")),
      );
    }
  }

  void _onFilePicked(File? f, String which) {
    setState(() {
      if (which == 'orig') originalId = f;
      if (which == 'parent') parentIdOrDeath = f;
    });
  }

  @override
  void dispose() {
    mobileController.dispose();
    super.dispose();
  }

  Widget _statusChip() {
    final color = status.contains('Payment') ? Colors.green : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  Widget _documentUploadCard(String title, String hint, File? file, Function(File?) onPicked) {
    final isUploaded = file != null;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Container(
        decoration: BoxDecoration(
          color: isUploaded ? Colors.green.shade50 : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isUploaded ? Colors.green.shade300 : Colors.grey.shade300),
        ),
        padding: const EdgeInsets.all(12),
        child: InkWell(
          onTap: () async {
            // Simulate file pick - replace with real file picker in production
            onPicked(File('simulated_${title.replaceAll(" ", "_")}.pdf'));
          },
          child: Row(
            children: [
              Icon(isUploaded ? Icons.check_circle : Icons.cloud_upload_outlined, 
                   color: isUploaded ? Colors.green : Colors.grey.shade600, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      isUploaded ? 'File uploaded' : hint,
                      style: TextStyle(color: isUploaded ? Colors.green : Colors.grey.shade600, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Icon(isUploaded ? Icons.verified : Icons.arrow_forward_ios, 
                   color: isUploaded ? Colors.green : Colors.grey.shade500, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double amount = applicationType == 'first_time' ? 7000.0 : 3000.0;
    final progress = _getCompletionPercentage();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FB),
      appBar: AppBar(
        backgroundColor: _brandColor,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text('Apply for Birth Certificate'),
          ],
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Progress & Status Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Application Progress', style: TextStyle(fontWeight: FontWeight.w600)),
                        _statusChip(),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(value: progress / 100, color: _brandColor, minHeight: 8),
                    ),
                    const SizedBox(height: 6),
                    Text('$progress% Complete', style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Application Type Selection
            const Text('Application Type', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Text('First Time Application'),
                    selected: applicationType == 'first_time',
                    onSelected: (_) => _selectApplicationType('first_time'),
                    selectedColor: _brandColor,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('Replacement (Lost)'),
                    selected: applicationType == 'lost',
                    onSelected: (_) => _selectApplicationType('lost'),
                    selectedColor: _brandColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Required Documents
            const Text('Required Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            _documentUploadCard(
              '🆔 Original ID',
              'Upload your original ID (national ID or passport)',
              originalId,
              (f) => _onFilePicked(f, 'orig'),
            ),
            const SizedBox(height: 12),
            _documentUploadCard(
              '👨‍👩‍👧 Parent ID / Death Certificate',
              'Upload parent ID or death certificate if applicable',
              parentIdOrDeath,
              (f) => _onFilePicked(f, 'parent'),
            ),
            const SizedBox(height: 18),

            // Mobile Number
            const Text('Contact Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            TextField(
              controller: mobileController,
              keyboardType: TextInputType.phone,
              onChanged: (v) => setState(() {}),
              decoration: InputDecoration(
                labelText: 'Mobile Number',
                hintText: '07XXXXXXXX or 0712345678',
                prefixIcon: const Icon(Icons.phone_outlined),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              ),
            ),
            const SizedBox(height: 18),

            // Info Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue.shade700),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Fee: KES ${applicationType == 'first_time' ? '7,000' : '3,000'} (M-Pesa payment). Secure & encrypted.',
                      style: TextStyle(color: Colors.blue.shade700, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              height: 54,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _brandColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _payAndSubmit,
                child: Text(
                  'Pay & Submit — KES $amount',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
