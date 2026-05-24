// lib/screens/payment_screen.dart

import 'package:flutter/material.dart';
import '../models/candidate_model.dart';
import '../services/payment_service.dart';
import '../agents_portal/services/payment_service.dart'
    as agent_payment_service;
import '../agents_portal/models/payment_model.dart';

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
  String paymentMethod = 'mpesa'; // default
  bool paymentConfirmed = false;
  bool isLoading = false;

  final PaymentService _paymentService = PaymentService();
  final agent_payment_service.PaymentService _agentPaymentService =
      agent_payment_service.PaymentService();
  final TextEditingController _phoneController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _recordAgentPayment(String intentId,
      {PaymentStatus status = PaymentStatus.pending}) async {
    await _agentPaymentService.createPayment(
      userId: widget.candidate.id,
      type: PaymentType.employerPayment,
      amount: widget.amount,
      reference: intentId,
      status: status,
    );
  }

  Future<void> _pay() async {
    setState(() => isLoading = true);

    try {
      final intentId = await _paymentService.createPaymentIntent(
        candidateId: widget.candidate.id,
        amount: widget.amount,
        paymentMethod: paymentMethod == 'card' ? 'card' : paymentMethod,
        title: widget.title,
      );

      final success = await _paymentService.submitPaymentBackend(
        intentId: intentId,
        candidateId: widget.candidate.id,
        amount: widget.amount,
        title: widget.title,
      );

      if (success) {
        await _recordAgentPayment(intentId, status: PaymentStatus.completed);
        setState(() => paymentConfirmed = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment Successful!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment failed.')),
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

  void _proceedNextStep() {
    if (!paymentConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete payment first.')),
      );
      return;
    }

    Navigator.pop(context, true); // Send confirmation back
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Amount: KES ${widget.amount}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text('Choose Payment Method:'),
            RadioListTile(
              title: const Text('MPESA Paybill / Account'),
              value: 'mpesa',
              groupValue: paymentMethod,
              onChanged: (value) =>
                  setState(() => paymentMethod = value.toString()),
            ),
            RadioListTile(
              title: const Text('Visa / MasterCard / Flutterwave'),
              value: 'card',
              groupValue: paymentMethod,
              onChanged: (value) =>
                  setState(() => paymentMethod = value.toString()),
            ),
            const SizedBox(height: 16),
            if (paymentMethod == 'mpesa') ...[
              const Text('Paybill: 600100'),
              const Text('Account No: 0100011879308'),
              const SizedBox(height: 8),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Enter your mobile number',
                  hintText: '07XXXXXXXX',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
            ] else if (paymentMethod == 'card') ...[
              const SizedBox(height: 8),
              const Text(
                  'You will be redirected to a secure card payment gateway.'),
            ],
            const SizedBox(height: 10),
            isLoading
                ? const Center(child: CircularProgressIndicator())
                : ElevatedButton(
                    onPressed: _pay,
                    child: Text(
                      paymentMethod == 'mpesa'
                          ? 'Pay with MPESA'
                          : 'Pay with Card / Flutterwave',
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
