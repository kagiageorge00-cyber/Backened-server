import 'dart:io';
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../widgets/file_upload_tile.dart';
import '../../widgets/payment_helper.dart';

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

  void _selectApplicationType(String type) {
    setState(() {
      applicationType = type;
    });
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

    try {
      setState(() {
        status = 'Waiting for payment...';
      });

      final ok = await showUnifiedPaymentDialog(
        context,
        payerName: 'Applicant',
        payerPhone: mobileController.text.trim(),
        amount: amount,
        title: 'Birth Certificate Payment',
      );

      if (ok) {
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
              TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('OK'))
            ],
          ),
        );
      } else {
        setState(() { status = 'Payment failed or cancelled'; });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment not completed.')));
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

  @override
  Widget build(BuildContext context) {
    double amount = applicationType == 'first_time' ? 7000.0 : 3000.0;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text('Apply for Birth Certificate'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _statusChip(),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ChoiceChip(
                  label: const Text('First Time'),
                  selected: applicationType == 'first_time',
                  onSelected: (_) => _selectApplicationType('first_time'),
                ),
                ChoiceChip(
                  label: const Text('Lost Certificate'),
                  selected: applicationType == 'lost',
                  onSelected: (_) => _selectApplicationType('lost'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                children: [
                  FileUploadTile(
                    title: 'Original ID',
                    hint: 'Upload your original ID',
                    onFilePicked: (f) => _onFilePicked(f, 'orig'),
                  ),
                  FileUploadTile(
                    title: 'Parent ID / Death Certificate',
                    hint: 'Upload parent ID or death certificate',
                    onFilePicked: (f) => _onFilePicked(f, 'parent'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: mobileController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                        labelText: 'Mobile number', hintText: '07XXXXXXXX'),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _payAndSubmit,
                    child: Text('Pay & Submit (KES $amount)'),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
