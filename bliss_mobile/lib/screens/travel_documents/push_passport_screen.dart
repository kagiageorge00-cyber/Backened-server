import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../../widgets/payment_helper.dart';

class PushPassportScreen extends StatefulWidget {
  static const routeName = '/pushPassport';

  const PushPassportScreen({super.key});

  @override
  State<PushPassportScreen> createState() => _PushPassportScreenState();
}

class _PushPassportScreenState extends State<PushPassportScreen> {
  String? trackingReceiptFile;
  final TextEditingController mobileController = TextEditingController();
  String status = 'Draft';

  Future<void> pickFile() async {
    setState(() => trackingReceiptFile = "tracking_receipt.pdf");
  }

  Future<void> _payAndSubmit() async {
    if (trackingReceiptFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please upload the passport tracking receipt")),
      );
      return;
    }

    String phone = mobileController.text.trim();
    if (phone.length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter a valid mobile number")),
      );
      return;
    }

    if (phone.startsWith("0")) phone = "254${phone.substring(1)}";

    setState(() => status = "Waiting for payment...");

    final ok = await showUnifiedPaymentDialog(
      context,
      payerName: 'Applicant',
      payerPhone: mobileController.text.trim(),
      amount: 15000.0,
      title: 'Push Passport Payment',
    );

    if (ok) {
      setState(() => status = "Payment received • Submitted");
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Submitted'),
          content: const Text('Our team will reach out to you to continue with your application.'),
          actions: [TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('OK'))],
        ),
      );
    } else {
      setState(() => status = "Payment failed or cancelled");
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment not completed.')));
    }
  }

  Widget _statusChip() {
    final color = status.contains("Payment") ? Colors.green : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  @override
  void dispose() {
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
            Text("Push Passport"),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _statusChip(),
            const SizedBox(height: 16),
            TextField(
              controller: mobileController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                  labelText: "Mobile Number", hintText: "07XXXXXXXX", filled: true, fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.grey[800] : Colors.white),
              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black87, fontSize: 16),
            ),
            const SizedBox(height: 16),
            const Text("Upload Passport Tracking Receipt"),
            TextButton(
              onPressed: pickFile,
              child: Text(trackingReceiptFile ?? "Choose File"),
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _payAndSubmit,
                child: const Text("Pay & Submit (KES 15,000)"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
