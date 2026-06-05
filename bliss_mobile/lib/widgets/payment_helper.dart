import 'package:flutter/material.dart';
import 'dart:math';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../screens/payments_screen.dart';
import '../models/candidate_model.dart';
import '../agents_portal/models/payment_model.dart';
import '../agents_portal/services/payment_service.dart'
    as agent_payment_service;

/// Shows a unified payment dialog for direct transfers and secure card flows.
Future<bool> showUnifiedPaymentDialog(
  BuildContext context, {
  required String payerName,
  required String payerPhone,
  required double amount,
  required String title,
  String? associatedId,
}) async {
  final agentPaymentService = agent_payment_service.PaymentService();
  final bool isBirthCertificate = title.toLowerCase().contains('birth');
  String method = isBirthCertificate ? 'manual' : 'card';
  final TextEditingController msgCtrl = TextEditingController();
  final TextEditingController emailCtrl = TextEditingController();
  final dialogResult = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      bool processing = false;
      String? error;
      return StatefulBuilder(builder: (context, setState) {
        return AlertDialog(
          title: Text(title),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RadioListTile<String>(
                  value: 'card',
                  groupValue: method,
                  title: const Text('Card / Mobile Money'),
                  subtitle:
                      const Text('Pay securely via card or mobile money.'),
                  onChanged: (v) => setState(() => method = v ?? 'card'),
                ),
                RadioListTile<String>(
                  value: 'manual',
                  groupValue: method,
                  title:
                      const Text('Direct Transfer / MoneyGram / Western Union'),
                  subtitle: Text(isBirthCertificate
                      ? 'Send money to our number and paste the transaction message below.'
                      : 'Send via bank transfer, MoneyGram or Western Union and paste confirmation.'),
                  onChanged: (v) => setState(() => method = v ?? 'manual'),
                ),
                const SizedBox(height: 8),
                if (method == 'manual') ...[
                  Text(
                    isBirthCertificate
                        ? 'Use our verified number for the transfer. After sending, paste the processor message here.'
                        : 'Use Equity Bank, MoneyGram or Western Union and paste the transfer confirmation here.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: msgCtrl,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'Paste transfer confirmation message here',
                    ),
                  ),
                ] else if (method == 'card') ...[
                  const Text(
                      'You will be redirected to a secure card payment flow. No account number is exposed here.'),
                  const SizedBox(height: 12),
                  TextField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Email (required)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Text(error!, style: const TextStyle(color: Colors.red)),
                ]
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: processing
                  ? null
                  : () async {
                      setState(() {
                        processing = true;
                        error = null;
                      });

                      if (method == 'manual') {
                        final msg = msgCtrl.text.trim();
                        if (msg.isEmpty) {
                          setState(() {
                            processing = false;
                            error =
                                'Please paste the transaction or confirmation message.';
                          });
                          return;
                        }

                        final containsAmount = RegExp(
                          r"\b${amount.toStringAsFixed(0)}\b|KES\s*${amount.toStringAsFixed(0)}|USD\s*${amount.toStringAsFixed(0)}",
                          caseSensitive: false,
                        ).hasMatch(msg);
                        if (!containsAmount) {
                          setState(() {
                            processing = false;
                            error =
                                'The confirmation message does not contain the expected amount.';
                          });
                          return;
                        }

                        String? tx;
                        final txRegex = RegExp(r"[A-Z0-9]{6,}");
                        final match = txRegex.firstMatch(msg.toUpperCase());
                        if (match != null) tx = match.group(0);

                        final id = associatedId ??
                            'P${100000 + Random().nextInt(899999)}';
                        final transactionRef = tx ?? id;

                        // Send payment record to backend API
                        await http.post(
                          Uri.parse(
                              'https://your-backend-url/api/payments/manual'),
                          headers: {'Content-Type': 'application/json'},
                          body: jsonEncode({
                            'payerId': id,
                            'payerName': payerName,
                            'amount': amount,
                            'paymentMethod': 'manual',
                            'transactionId': transactionRef,
                            'confirmationMessage': msg,
                            'status': 'verified',
                          }),
                        );

                        Navigator.of(context).pop(true);
                        return;
                      }

                      if (method == 'card') {
                        final email = emailCtrl.text.trim();
                        if (email.isEmpty) {
                          setState(() {
                            processing = false;
                            error = 'Email is required for card payments.';
                          });
                          return;
                        }

                        final cid = associatedId ??
                            'P${100000 + Random().nextInt(899999)}';
                        final candidate = Candidate(
                          id: cid,
                          fullName: payerName,
                          age: 0,
                          gender: 'N/A',
                          country: '',
                          expectedSalary: 0,
                          hireCost: 0,
                          skills: [],
                          experienceYears: 0,
                          photoUrl: '',
                          passportStatus: '',
                          visaOption: '',
                          currency: 'KES',
                          phone: payerPhone,
                          email: email,
                        );

                        final paid = await Navigator.push<bool?>(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PaymentsScreen(
                              candidate: candidate,
                              employerId: 'SYSTEM',
                              employerName: 'bliss',
                              visaOption: 'payment',
                              amount: amount,
                              title: title,
                            ),
                          ),
                        );

                        if (paid == true) {
                          final id = associatedId ??
                              'P${100000 + Random().nextInt(899999)}';
                          await agentPaymentService.createPayment(
                            userId: id,
                            type: PaymentType.employerPayment,
                            amount: amount,
                            reference: id,
                            status: PaymentStatus.completed,
                          );
                        }

                        Navigator.of(context).pop(paid == true);
                        return;
                      }

                      setState(() {
                        processing = false;
                        error = 'Unsupported payment method selected.';
                      });
                    },
              child: processing
                  ? const SizedBox(
                      width: 20, height: 20, child: CircularProgressIndicator())
                  : const Text('Proceed'),
            ),
          ],
        );
      });
    },
  );

  return dialogResult ?? false;
}
