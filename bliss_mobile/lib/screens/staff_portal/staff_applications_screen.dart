import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

class StaffApplicationsScreen extends StatelessWidget {
  const StaffApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final apps = List.generate(10, (i) => 'Application #${1000 + i}');

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text('Paid Applications'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            Card(
              margin: EdgeInsets.zero,
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                title: const Text('Filter & search'),
                leading: const Icon(Icons.search),
                trailing: const Icon(Icons.filter_list),
                onTap: () => Navigator.pushNamed(context, '/staff/filters'),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                itemCount: apps.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, idx) {
                  return ListTile(
                    title: Text(apps[idx], style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text('Paid • Processing'),
                    leading: const Icon(Icons.receipt_long),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () => Navigator.pushNamed(context, '/staff/applicationDetail', arguments: {'applicationId': apps[idx]}),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}