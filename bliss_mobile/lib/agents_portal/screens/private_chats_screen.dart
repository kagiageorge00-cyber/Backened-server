import 'package:flutter/material.dart';
import '../constants/colors.dart';
import '../services/payment_service.dart';

class PrivateChatsScreen extends StatefulWidget {
  final String agentId;

  const PrivateChatsScreen({super.key, required this.agentId});

  @override
  State<PrivateChatsScreen> createState() => _PrivateChatsScreenState();
}

class _PrivateChatsScreenState extends State<PrivateChatsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final PaymentService _paymentService = PaymentService(); // ✅ FIXED

  final List<String> _tabs = ['All', 'Candidates', 'Employers', 'Agents'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // ✅ FIXED PAYMENT FUNCTION
  Future<void> _createPayment(String name, String phone) async {
    try {
      await _paymentService.createPayment(
        name: name.trim(),
        phone: phone.trim(),
        transactionCode:
            "AGENT_SUB_${widget.agentId}_${DateTime.now().millisecondsSinceEpoch}",
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment created successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chats'),
        backgroundColor: AppColors.primary,
        bottom: TabBar(
          controller: _tabController,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
          indicatorColor: AppColors.accent,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
        ),
      ),
      backgroundColor: AppColors.background,

      // ✅ CLEAN PLACEHOLDER UI
      body: TabBarView(
        controller: _tabController,
        children: _tabs.map((tab) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$tab Chats',
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),

                // TEST BUTTON (optional)
                ElevatedButton(
                  onPressed: () {
                    _createPayment("Test User", "0700000000");
                  },
                  child: const Text("Test Payment"),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
