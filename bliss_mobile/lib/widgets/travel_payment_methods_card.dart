import 'package:flutter/material.dart';

/// Widget to display available payment methods for travel documents
class TravelPaymentMethodsCard extends StatelessWidget {
  final double amount;
  final VoidCallback onMpesaSelected;
  final VoidCallback onFlutterwaveSelected;
  final VoidCallback onPayPalSelected;

  const TravelPaymentMethodsCard({
    super.key,
    required this.amount,
    required this.onMpesaSelected,
    required this.onFlutterwaveSelected,
    required this.onPayPalSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
        color: Colors.grey.shade50,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.payment, color: Colors.blue.shade700),
              const SizedBox(width: 8),
              const Text(
                'Payment Methods',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Total Amount: KES ${amount.toStringAsFixed(0)}',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87),
          ),
          const SizedBox(height: 16),
          
          // MPESA Option
          _buildPaymentOption(
            icon: Icons.phone_android,
            title: 'M-PESA',
            subtitle: 'Pay via Paybill 600100',
            color: Colors.green,
            onTap: onMpesaSelected,
          ),
          const SizedBox(height: 10),

          // Flutterwave Option
          _buildPaymentOption(
            icon: Icons.credit_card,
            title: 'Flutterwave / Card',
            subtitle: 'Visa, MasterCard, Mobile Money',
            color: Colors.orange,
            onTap: onFlutterwaveSelected,
          ),
          const SizedBox(height: 10),

          // PayPal Option
          _buildPaymentOption(
            icon: Icons.account_balance_wallet,
            title: 'PayPal',
            subtitle: 'International payments',
            color: Colors.indigo,
            onTap: onPayPalSelected,
          ),
          
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, size: 18, color: Colors.blue.shade700),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Secure payment processing. Your data is encrypted.',
                    style: TextStyle(fontSize: 12, color: Colors.blue.shade700),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
            color: Colors.white,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
