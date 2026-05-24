import 'dart:io';
import 'package:flutter/material.dart';
import '../../widgets/payment_helper.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../widgets/file_upload_tile.dart';

class InvitationLetterForm extends StatefulWidget {
  const InvitationLetterForm({super.key});

  @override
  State<InvitationLetterForm> createState() => _InvitationLetterFormState();
}

class _InvitationLetterFormState extends State<InvitationLetterForm> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController passportNoController = TextEditingController();
  final TextEditingController purposeController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();

  File? passportCopy;
  File? previousVisa;

  bool paymentConfirmed = false;
  String status = 'Draft';

  void _onFilePicked(File? f, String type) {
    setState(() {
      if (type == 'passport') passportCopy = f;
      if (type == 'visa') previousVisa = f;
    });
  }

  Future<void> _payWithMpesa() async {
    if (!_formKey.currentState!.validate()) return;

    if (passportCopy == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Upload passport copy')));
      return;
    }

    setState(() {
      status = 'Waiting for payment...';
    });

    double amount = 20000; // KES 20,000

    try {
      final ok = await showUnifiedPaymentDialog(
        context,
        payerName: fullNameController.text.trim().isNotEmpty
            ? fullNameController.text.trim()
            : 'Applicant',
        payerPhone: mobileController.text.trim(),
        amount: amount,
        title: 'Invitation Letter Payment',
      );

      if (ok) {
        setState(() {
          status = 'Payment received • You can submit form';
          paymentConfirmed = true;
        });
      } else {
        setState(() {
          status = 'Payment failed or cancelled';
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment not completed.')));
      }
    } catch (e) {
      setState(() {
        status = 'Payment failed';
      });
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text("Payment failed: $e")));
    }
  }

  Future<void> _submitForm() async {
    if (!paymentConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complete payment first')));
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      status = 'Application submitted';
    });

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Application Submitted'),
        content: const Text(
            'Your invitation letter request has been submitted successfully. Our team will contact you for next steps.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(), child: const Text('OK'))
        ],
      ),
    );
  }

  Widget _statusChip() {
    final color = status.contains('Payment') || paymentConfirmed
        ? Colors.green
        : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  @override
  void dispose() {
    fullNameController.dispose();
    passportNoController.dispose();
    purposeController.dispose();
    mobileController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Invitation Letter Form"),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _statusChip(),
            const SizedBox(height: 12),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: fullNameController,
                    decoration: InputDecoration(
                        labelText: 'Full Name',
                        filled: true,
                        fillColor:
                            Theme.of(context).brightness == Brightness.dark
                                ? Colors.grey[800]
                                : Colors.white),
                    style: TextStyle(
                        color: Theme.of(context).textTheme.bodyLarge?.color ??
                            Colors.black87,
                        fontSize: 16),
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Enter full name' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: passportNoController,
                    decoration: InputDecoration(
                        labelText: 'Passport Number',
                        filled: true,
                        fillColor:
                            Theme.of(context).brightness == Brightness.dark
                                ? Colors.grey[800]
                                : Colors.white),
                    style: TextStyle(
                        color: Theme.of(context).textTheme.bodyLarge?.color ??
                            Colors.black87,
                        fontSize: 16),
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Enter passport number' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: purposeController,
                    decoration: InputDecoration(
                        labelText: 'Purpose of Visit',
                        filled: true,
                        fillColor:
                            Theme.of(context).brightness == Brightness.dark
                                ? Colors.grey[800]
                                : Colors.white),
                    style: TextStyle(
                        color: Theme.of(context).textTheme.bodyLarge?.color ??
                            Colors.black87,
                        fontSize: 16),
                    validator: (v) => v == null || v.isEmpty
                        ? 'Enter purpose of visit'
                        : null,
                  ),
                  const SizedBox(height: 8),
                  FileUploadTile(
                    title: 'Upload Passport Copy',
                    hint: 'Select file',
                    onFilePicked: (f) => _onFilePicked(f, 'passport'),
                  ),
                  FileUploadTile(
                    title: 'Upload Previous Visa Copies (optional)',
                    hint: 'Select file',
                    onFilePicked: (f) => _onFilePicked(f, 'visa'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: mobileController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                        labelText: 'Mobile number',
                        hintText: '07XXXXXXXX',
                        filled: true,
                        fillColor:
                            Theme.of(context).brightness == Brightness.dark
                                ? Colors.grey[800]
                                : Colors.white),
                    style: TextStyle(
                        color: Theme.of(context).textTheme.bodyLarge?.color ??
                            Colors.black87,
                        fontSize: 16),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _payWithMpesa,
                    child: const Text('Pay KES 20,000'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: paymentConfirmed ? _submitForm : null,
                    child: const Text('Submit Application'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
