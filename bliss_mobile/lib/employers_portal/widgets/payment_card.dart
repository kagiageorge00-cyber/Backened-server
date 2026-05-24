import 'package:flutter/material.dart';

class PaymentCard extends StatelessWidget {
  final String invoiceId;
  final String candidateName;
  final String jobTitle;
  final double amount;
  final String date;
  final String status;
  final VoidCallback onTap;
  final Widget? action;

  const PaymentCard({
    super.key,
    required this.invoiceId,
    required this.candidateName,
    required this.jobTitle,
    required this.amount,
    required this.date,
    required this.status,
    required this.onTap,
    this.action,
  });

  Color getStatusColor() {
    switch (status.toLowerCase()) {
      case "paid":
        return Colors.green;
      case "pending":
        return Colors.orange;
      case "failed":
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 8,
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            title: Text(
              "$candidateName - $jobTitle",
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            subtitle: Text(
              "Invoice: $invoiceId\nAmount: \$$amount\nDate: $date",
              style: TextStyle(color: Colors.grey.shade600),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: getStatusColor().withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: getStatusColor(),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                action ?? const Icon(Icons.arrow_forward_ios, size: 16),
              ],
            ),
            onTap: onTap,
          ),
        ),
      ),
    );
  }
}
