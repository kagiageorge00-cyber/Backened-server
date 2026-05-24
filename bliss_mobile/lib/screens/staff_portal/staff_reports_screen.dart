import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class StaffReportsScreen extends StatelessWidget {
  const StaffReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Reports & Analytics'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 3,
              child: ListTile(
                leading: const Icon(Icons.bar_chart, size: 28),
                title: const Text('Monthly Summary'),
                subtitle: const Text('View revenue, hires and conversion rates.'),
                onTap: () => Navigator.pushNamed(context, '/staff/reportMonthly'),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.show_chart, size: 56, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('Charts will be displayed here', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}