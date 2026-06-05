import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/colors.dart';

class AgentPaymentsScreen extends StatefulWidget {
  final String agentId;
  const AgentPaymentsScreen({super.key, required this.agentId});

  @override
  State<AgentPaymentsScreen> createState() => _AgentPaymentsScreenState();
}

class _AgentPaymentsScreenState extends State<AgentPaymentsScreen> {
  Future<List<Map<String, dynamic>>> _fetchPayments() async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/getAgentPayments'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'agentId': widget.agentId}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to load payments');
    }
    final data = jsonDecode(response.body);
    if (data['success'] != true || data['payments'] == null) {
      return <Map<String, dynamic>>[];
    }
    return List<Map<String, dynamic>>.from(data['payments']);
  }

  Future<void> _markPaymentCompleted(
      BuildContext context, String paymentId, String? candidateId) async {
    final response = await http.post(
      Uri.parse('https://backened-server.onrender.com/markPaymentCompleted'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'paymentId': paymentId,
        'candidateId': candidateId,
      }),
    );

    if (!mounted) return;
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment marked completed.')),
        );
        setState(() {});
        return;
      }
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Failed to mark payment: ${response.body}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments'),
        backgroundColor: AppColors.primary,
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchPayments(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
                child: Text('Error loading payments: ${snapshot.error}'));
          }
          final payments = snapshot.data ?? <Map<String, dynamic>>[];
          if (payments.isEmpty) {
            return const Center(child: Text('No payments yet'));
          }
          return ListView.builder(
            itemCount: payments.length,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            itemBuilder: (context, index) {
              final payment = payments[index];
              final paymentId = payment['paymentId']?.toString() ?? '';
              return Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8.0, vertical: 10),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha((0.3 * 255).toInt()),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: ListTile(
                      tileColor: Colors.white,
                      title: Text(
                          '${payment['type'] ?? 'Payment'}: \$${payment['amount'] ?? '0'}',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                          'Status: ${payment['status'] ?? ''}\nDate: ${payment['createdAt'] ?? ''}\nNote: ${payment['note'] ?? ''}'),
                      trailing: payment['status'] == 'pending'
                          ? ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              onPressed: () async {
                                await _markPaymentCompleted(
                                  context,
                                  paymentId,
                                  payment['candidateId']?.toString(),
                                );
                              },
                              child: const Text('Mark Paid'),
                            )
                          : const Icon(Icons.check_circle, color: Colors.green),
                    ),
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
