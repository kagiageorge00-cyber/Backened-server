import 'package:flutter/material.dart';
import '../services/stripe_service.dart';

class DeploymentFeeScreen extends StatefulWidget {
  const DeploymentFeeScreen({super.key});

  @override
  _DeploymentFeeScreenState createState() => _DeploymentFeeScreenState();
}

class _DeploymentFeeScreenState extends State<DeploymentFeeScreen> {
  // ...existing code...

  Future<void> _processPayment() async {
    try {
      final paymentIntent = await StripeService.createPaymentIntent(100000, 'usd'); // $1000 in cents
      await StripeService.presentPaymentSheet(paymentIntent['client_secret']);
      // Handle success
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment successful!')),
      );
      // Grant access logic here
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment failed: $e')),
      );
    }
  }

  // ...existing code...

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Deployment Fee')),
      body: Center(
        child: ElevatedButton(
          onPressed: _processPayment,
          child: Text('Pay \$1000'),
        ),
      ),
    );
  }
}