// lib/screens/payments_history_screen.dart
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class PaymentsHistoryScreen extends StatelessWidget {
  const PaymentsHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final CollectionReference payments =
        FirebaseFirestore.instance.collection('payments');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment History'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: payments.orderBy('timestamp', descending: true).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No payments found.'));
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;
              final amount = data['amount'] ?? 0;
              final transactionId = data['transactionId'] ?? '';
              final status = data['status'] ?? 'pending';
              final timestamp = (data['timestamp'] as Timestamp?)?.toDate();

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: ListTile(
                  title: Text('Amount: \$${amount.toString()}'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Transaction ID: $transactionId'),
                      Text('Status: $status'),
                      if (timestamp != null)
                        Text('Date: ${timestamp.toLocal().toString().split('.')[0]}'),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
