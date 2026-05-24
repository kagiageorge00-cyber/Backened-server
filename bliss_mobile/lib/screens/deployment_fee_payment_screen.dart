import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
// backend-only auth: use employerId passed into the screen
import '../services/stripe_service.dart';
import '../agents_portal/services/payment_service.dart'
    as agent_payment_service;
import '../agents_portal/models/payment_model.dart';

class DeploymentFeePaymentScreen extends StatefulWidget {
  final String candidateId;
  final String employerId;

  const DeploymentFeePaymentScreen({
    super.key,
    required this.candidateId,
    required this.employerId,
  });

  @override
  State<DeploymentFeePaymentScreen> createState() =>
      _DeploymentFeePaymentScreenState();
}

class _DeploymentFeePaymentScreenState
    extends State<DeploymentFeePaymentScreen> {
  bool _processing = false;
  final agent_payment_service.PaymentService _agentPaymentService =
      agent_payment_service.PaymentService();

  Future<void> _processPayment() async {
    setState(() => _processing = true);
    try {
      final employerDoc = await FirebaseFirestore.instance
          .collection('employers')
          .doc(widget.employerId)
          .get();
      final employerEmail = (employerDoc.exists && employerDoc.data() != null)
          ? (employerDoc.data()!['email'] ?? '')
          : '';

      final success = await StripeService.processPayment(
        amount: 100000,
        currency: 'usd',
        customerEmail: employerEmail,
      );

      if (!success) throw Exception('Payment failed');

      await _agentPaymentService.createPayment(
        userId: widget.employerId,
        type: PaymentType.employerPayment,
        amount: 1000,
        reference: 'stripe_${DateTime.now().millisecondsSinceEpoch}',
        status: PaymentStatus.completed,
      );

      await FirebaseFirestore.instance.collection('payments').add({
        'employerId': widget.employerId,
        'candidateId': widget.candidateId,
        'amount': 1000,
        'currency': 'USD',
        'type': 'deployment_fee',
        'status': 'completed',
        'stripePaymentId': 'simulated_payment_id',
        'createdAt': FieldValue.serverTimestamp(),
      });

      await FirebaseFirestore.instance
          .collection('employers')
          .doc(widget.employerId)
          .collection('accessed_candidates')
          .doc(widget.candidateId)
          .set({
        'accessedAt': FieldValue.serverTimestamp(),
        'feePaid': true,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text(
                  'Payment successful! You can now view candidate details.')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment failed: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Deployment Fee Payment'),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? [const Color(0xFF101C33), const Color(0xFF0D132A)]
                : [const Color(0xFFEFF4FF), const Color(0xFFFFFFFF)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Access Candidate Details',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Card(
                elevation: 3,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Deployment Fee: \$1000 USD',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 10),
                      Text(
                        'This fee covers the 2-year contract deployment process and grants you access to:',
                        style: TextStyle(fontSize: 16),
                      ),
                      SizedBox(height: 10),
                      Text('• Candidate\'s full documents'),
                      Text('• Contact phone number'),
                      Text('• Direct communication access'),
                      Text('• Interview scheduling'),
                      SizedBox(height: 20),
                      Text(
                        'Note: This is a one-time fee per candidate for the contract period.',
                        style: TextStyle(
                            fontStyle: FontStyle.italic, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _processing ? null : _processPayment,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _processing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          'Pay \$1000 & Access Details',
                          style: TextStyle(fontSize: 18),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
