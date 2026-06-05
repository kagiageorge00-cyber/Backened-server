import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/colors.dart';

class AgentSubscriptionScreen extends StatefulWidget {
  final String agentId;
  const AgentSubscriptionScreen({super.key, required this.agentId});

  @override
  State<AgentSubscriptionScreen> createState() =>
      _AgentSubscriptionScreenState();
}

class _AgentSubscriptionScreenState extends State<AgentSubscriptionScreen> {
  late Future<Map<String, dynamic>> _subscriptionFuture;

  @override
  void initState() {
    super.initState();
    _subscriptionFuture = _loadSubscriptionData();
  }

  Future<Map<String, dynamic>> _loadSubscriptionData() async {
    try {
      final response = await http.post(
        Uri.parse('https://backened-server.onrender.com/getAgentSubscription'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'agentId': widget.agentId}),
      );

      if (response.statusCode != 200) {
        return {'isActive': false, 'plan': 'None'};
      }

      final data = jsonDecode(response.body);
      if (data['success'] != true || data['subscription'] == null) {
        return {'isActive': false, 'plan': 'None'};
      }

      final subscription = data['subscription'];
      final endDate = subscription['subscriptionEnd'] != null
          ? DateTime.tryParse(subscription['subscriptionEnd'] as String)
          : null;
      return {
        'isActive': endDate != null ? endDate.isAfter(DateTime.now()) : false,
        'endDate': endDate,
        'plan': subscription['plan'] ?? 'Basic',
        'createdAt': subscription['subscriptionStart'] != null
            ? DateTime.tryParse(subscription['subscriptionStart'] as String)
            : null,
      };
    } catch (e) {
      debugPrint('Error loading subscription: $e');
      return {'isActive': false, 'error': e.toString()};
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription'),
        backgroundColor: AppColors.primary,
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _subscriptionFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final data = snapshot.data ?? {};
          final isActive = data['isActive'] as bool? ?? false;
          final plan = data['plan'] as String? ?? 'Basic';
          final endDate = data['endDate'] as DateTime?;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status Card
                Container(
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
                    child: Container(
                      color: isActive ? Colors.green : Colors.orange,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isActive ? Icons.verified : Icons.info,
                                color: Colors.white,
                                size: 32,
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isActive ? 'Active' : 'Inactive',
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                  Text(
                                    '$plan Plan',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (endDate != null)
                            Text(
                              'Expires on: ${endDate.day}/${endDate.month}/${endDate.year}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Subscription Details
                const Text(
                  'Subscription Details',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),

                Container(
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
                    child: Column(
                      children: [
                        _buildDetailRow('Plan Type', plan),
                        const Divider(height: 0),
                        _buildDetailRow(
                          'Status',
                          isActive ? 'Active' : 'Inactive',
                          statusColor: isActive ? Colors.green : Colors.orange,
                        ),
                        const Divider(height: 0),
                        _buildDetailRow(
                          'Expires',
                          endDate != null
                              ? '${endDate.day}/${endDate.month}/${endDate.year}'
                              : 'N/A',
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Upgrade Button
                if (!isActive)
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 8,
                        )
                      ],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content:
                                    Text('Upgrade functionality coming soon')),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Upgrade Subscription',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),

                // Renewal Button
                if (isActive)
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 8,
                        )
                      ],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content:
                                    Text('Renewal functionality coming soon')),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Renew Subscription',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? statusColor}) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white
                    : Colors.black87),
          ),
          if (statusColor != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
        ],
      ),
    );
  }
}
