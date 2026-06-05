// lib/screens/payment_screen.dart

import 'package:flutter/material.dart';
import '../models/candidate_model.dart';
import '../services/payment_service.dart';

class PaymentsScreen extends StatefulWidget {
  static const routeName = '/payments';

  final Candidate candidate;
  final String employerId;
  final String employerName;
  final String visaOption;
  final double amount;
  final String title;

  const PaymentsScreen({
    required this.candidate,
    required this.employerId,
    required this.employerName,
    required this.visaOption,
    required this.amount,
    required this.title,
    super.key,
  });

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  String paymentMethod = 'mpesa';
  bool paymentConfirmed = false;
  bool isLoading = false;

  final TextEditingController _phoneController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  /// MAIN PAYMENT FUNCTION
  Future<void> _pay() async {
    if (paymentMethod == 'mpesa' && _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter phone number')),
      );
      return;
    }

    if (paymentMethod == 'card') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Card payments are not yet supported here. Please choose MPESA.')),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final paymentId = await PaymentService.createPayment(
        name: widget.candidate.fullName,
        phone: _phoneController.text,
        amount: widget.amount,
      );

      if (paymentId == null || paymentId.isEmpty) {
        throw Exception('Payment creation failed');
      }

      final verifySuccess = await PaymentService.verifyPayment(
        _phoneController.text,
      );

      if (!verifySuccess) {
        throw Exception('Payment verification failed');
      }

      setState(() => paymentConfirmed = true);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment Successful!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _proceedNextStep() {
    if (!paymentConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete payment first.')),
      );
      return;
    }

    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final amountLabel = widget.amount == 10
        ? 'USD ${widget.amount.toStringAsFixed(0)}'
        : 'KES ${widget.amount.toStringAsFixed(0)}';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Amount: $amountLabel',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            const Text(
              'Choose Payment Method:',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            RadioListTile(
              title: const Text('MPESA'),
              value: 'mpesa',
              groupValue: paymentMethod,
              onChanged: (value) =>
                  setState(() => paymentMethod = value.toString()),
            ),
            RadioListTile(
              title: const Text('Card / Flutterwave'),
              value: 'card',
              groupValue: paymentMethod,
              onChanged: (value) =>
                  setState(() => paymentMethod = value.toString()),
            ),
            const SizedBox(height: 10),
            if (paymentMethod == 'mpesa') ...[
              const Text(
                'Send KES 1,300 or USD 10 to +254798242350',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Use the M-Pesa number above for the candidate registration fee, then enter your phone number below.',
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+254701234567',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
            if (paymentMethod == 'card') ...[
              const SizedBox(height: 10),
              const Text('You will be redirected to secure payment.'),
            ],
            const SizedBox(height: 20),
            isLoading
                ? const Center(child: CircularProgressIndicator())
                : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _pay,
                      child: Text(
                        paymentMethod == 'mpesa'
                            ? 'Pay with MPESA'
                            : 'Pay with Card',
                      ),
                    ),
                  ),
            const Spacer(),
            Center(
              child: ElevatedButton(
                onPressed: _proceedNextStep,
                child: const Text('Proceed to Next Step'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
