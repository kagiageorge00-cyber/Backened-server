import 'package:flutter/material.dart';

class HomePlaceholderScreen extends StatelessWidget {
  const HomePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Dashboard center card layout
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Welcome card with logo + text
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Logo placeholder
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.work, size: 36, color: Colors.blue),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('Welcome back — manage jobs, candidates, payments and chats from here.',
                        style: TextStyle(fontSize: 16)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Quick action grid
          GridView.count(
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            children: [
              _QuickCard(icon: Icons.work_outline, label: 'Post Job', onTap: () => Navigator.pushNamed(context, '/sponsors')),
              _QuickCard(icon: Icons.search, label: 'Find Candidates', onTap: () => Navigator.pushNamed(context, '/candidates')),
              _QuickCard(icon: Icons.message_outlined, label: 'Messages', onTap: () => Navigator.pushNamed(context, '/messages')),
              _QuickCard(icon: Icons.payment, label: 'Payments', onTap: () => Navigator.pushNamed(context, '/payments')),
            ],
          ),

          const SizedBox(height: 20),
          // Simple info card
          const Card(
            child: Padding(
              padding: EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quick Tips', style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('- Keep candidate profiles updated.\n- Verify sponsors before placement.\n- Record payment receipts for every commission.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Small reusable quick action card
class _QuickCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickCard({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 30, color: Colors.blue),
              const Spacer(),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}
