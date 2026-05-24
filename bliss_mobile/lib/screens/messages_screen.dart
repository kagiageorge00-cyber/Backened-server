import 'package:flutter/material.dart';

class MessagesScreen extends StatelessWidget {
   const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // simple placeholder chat list
    return ListView(
      padding:  const EdgeInsets.all(12),
      children: List.generate(6, (i) {
        return Card(
          child: ListTile(
            leading: CircleAvatar(child: Text('A${i+1}')),
            title: Text('Chat with Agent ${i+1}'),
            subtitle:  const Text('Last message preview...'),
            onTap: () {},
          ),
        );
      }),
    );
  }
}