import 'package:flutter/material.dart';

class PaymentHelper {
  /// Show payment dialog with M-PESA, Flutterwave, and PayPal options
  static Future<bool?> showPaymentDialog({
    required BuildContext context,
    required double amount,
    required String description,
    required String reference,
  }) async {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Select Payment Method'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Amount: KES ${amount.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                description,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              _buildPaymentOption(
                context,
                icon: Icons.phone_android,
                title: 'M-PESA (Instant)',
                subtitle: 'Paybill: 600100\nAccount: 0100011879308',
                onTap: () => _processMPesaPayment(
                  context,
                  amount,
                  reference,
                ),
              ),
              const SizedBox(height: 12),
              _buildPaymentOption(
                context,
                icon: Icons.credit_card,
                title: 'Flutterwave (1-2 min)',
                subtitle: 'Card • Bank • Mobile Money',
                onTap: () => _processFlutterwavePayment(
                  context,
                  amount,
                  reference,
                  description,
                ),
              ),
              const SizedBox(height: 12),
              _buildPaymentOption(
                context,
                icon: Icons.payment,
                title: 'PayPal (5-10 min)',
                subtitle: 'International Payments',
                onTap: () => _processPayPalPayment(
                  context,
                  amount,
                  reference,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  static Widget _buildPaymentOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(icon, color: Colors.blue, size: 32),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  static Future<void> _processMPesaPayment(
    BuildContext context,
    double amount,
    String reference,
  ) async {
    try {
      // In production, integrate with actual M-PESA API
      // For now, simulate successful payment
      _showProcessingDialog(context);
      await Future.delayed(const Duration(seconds: 2));
      
      if (context.mounted) {
        Navigator.pop(context); // Close processing dialog
        Navigator.pop(context, true); // Return success
        _showSuccessSnackbar(context, 'M-PESA payment processed');
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close processing dialog
        _showErrorSnackbar(context, 'M-PESA payment failed: $e');
      }
    }
  }

  static Future<void> _processFlutterwavePayment(
    BuildContext context,
    double amount,
    String reference,
    String description,
  ) async {
    try {
      // In production, integrate with Flutterwave SDK
      // For now, simulate successful payment
      _showProcessingDialog(context);
      await Future.delayed(const Duration(seconds: 3));
      
      if (context.mounted) {
        Navigator.pop(context); // Close processing dialog
        Navigator.pop(context, true); // Return success
        _showSuccessSnackbar(context, 'Flutterwave payment processed');
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close processing dialog
        _showErrorSnackbar(context, 'Flutterwave payment failed: $e');
      }
    }
  }

  static Future<void> _processPayPalPayment(
    BuildContext context,
    double amount,
    String reference,
  ) async {
    try {
      // In production, integrate with PayPal SDK
      // For now, simulate successful payment
      _showProcessingDialog(context);
      await Future.delayed(const Duration(seconds: 5));
      
      if (context.mounted) {
        Navigator.pop(context); // Close processing dialog
        Navigator.pop(context, true); // Return success
        _showSuccessSnackbar(context, 'PayPal payment processed');
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close processing dialog
        _showErrorSnackbar(context, 'PayPal payment failed: $e');
      }
    }
  }

  static void _showProcessingDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            const Text('Processing payment...'),
          ],
        ),
      ),
    );
  }

  static void _showSuccessSnackbar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  static void _showErrorSnackbar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
