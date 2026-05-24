import 'package:flutter/material.dart';
import '../widgets/payment_card.dart';
import '../../widgets/payment_helper.dart';
import 'invoice_details_screen.dart';
import '../models/candidate_model.dart';

class PaymentsScreen extends StatelessWidget {
  final CandidateModel candidate;
  final String employerId;
  final String employerName;
  final String visaOption;
  final double amount;
  final String title;

  const PaymentsScreen({
    super.key,
    required this.candidate,
    required this.employerId,
    required this.employerName,
    required this.visaOption,
    required this.amount,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    // Example: Replace this with Firestore fetch later
    final List<Map<String, dynamic>> invoices = [
      {
        "invoiceId": "INV001",
        "candidateName": candidate.fullName,
        "jobTitle": "Applied for $visaOption Visa",
        "amount": amount,
        "date": DateTime.now().toIso8601String().split('T').first,
        "status": "Pending",
      },
      {
        "invoiceId": "INV002",
        "candidateName": "John Smith",
        "jobTitle": "Caregiver - Qatar",
        "amount": 350,
        "date": "2025-12-03",
        "status": "Paid",
      },
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        itemCount: invoices.length,
        itemBuilder: (context, index) {
          final invoice = invoices[index];
          return PaymentCard(
            invoiceId: invoice["invoiceId"],
            candidateName: invoice["candidateName"],
            jobTitle: invoice["jobTitle"],
            amount: invoice["amount"],
            date: invoice["date"],
            status: invoice["status"],
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => InvoiceDetailsScreen(invoice: invoice),
                ),
              );
            },
            action: invoice["status"] != 'Paid' ? ElevatedButton(
              onPressed: () async {
                final amount = (invoice["amount"] is num) ? (invoice["amount"] as num).toDouble() : double.tryParse('${invoice["amount"]}') ?? 0.0;
                final ok = await showUnifiedPaymentDialog(context, payerName: invoice["candidateName"], payerPhone: '', amount: amount, title: 'Invoice Payment', associatedId: invoice["invoiceId"]);
                if (ok) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment recorded')));
                }
              },
              child: const Text('Pay'),
            ) : null,
          );
        },
      ),
    );
  }
}
