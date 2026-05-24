import 'package:flutter/material.dart';

class ButtonsScreen extends StatelessWidget {
  final List<Map<String, String>> buttons = [
    {'name': 'Passport Application', 'status': 'Pending'},
    {'name': 'Birth Certificate', 'status': 'Approved'},
    {'name': 'Medical Application', 'status': 'Pending'},
    {'name': 'Visa Invitation', 'status': 'Approved'},
  ];

  ButtonsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Staff Buttons"),
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: buttons.length,
        itemBuilder: (context, index) {
          final item = buttons[index];
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ListTile(
              title: Text(item['name'] ?? ''),
              subtitle: Text("Status: ${item['status']}"),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {},
            ),
          );
        },
      ),
    );
  }
}
