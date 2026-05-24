import 'package:flutter/material.dart';
// import 'package:cloud_firestore/cloud_firestore.dart'; // REMOVED: Migrating from Firebase to backend server
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
  final List<String> _tabs = ['All', 'Candidates', 'Employers', 'Agents'];
  // String _selectedTab = 'All';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      setState(() {
        // _selectedTab = _tabs[_tabController.index];
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
      // TODO: Replace with backend server data fetching logic
      body: Center(
          child: Text(
              'Private chats will be loaded from backend server.')), // Placeholder
    );
  }

  Future<void> _createPayment(String name, String phone) async {
    await _paymentService.createPayment(
      name: name.trim(),
      phone: phone.trim(),
      transactionCode:
          "AGENT_SUB_${agent.agentId}_${DateTime.now().millisecondsSinceEpoch}",
    );
  }
}
