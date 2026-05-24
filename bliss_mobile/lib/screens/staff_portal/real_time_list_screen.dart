import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class RealTimeListScreen extends StatelessWidget {
  final String title;
  final String collectionName;
  final String displayField;
  final String? filterField; // optional filter

  const RealTimeListScreen({
    super.key,
    required this.title,
    required this.collectionName,
    required this.displayField,
    this.filterField,
  });

  @override
  Widget build(BuildContext context) {
    Query collectionQuery = FirebaseFirestore.instance.collection(collectionName);

    // If a filterField is provided, only show non-empty values
    if (filterField != null) {
      collectionQuery = collectionQuery.where(filterField!, isNotEqualTo: '');
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.blueAccent,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: collectionQuery.orderBy('timestamp', descending: true).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No records found'));
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;

              return Card(
                margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                child: ListTile(
                  title: Text(data[displayField]?.toString() ?? 'N/A'),
                  subtitle: Text('ID: ${docs[index].id}'),
                  trailing: filterField != null
                      ? Text(data[filterField!]?.toString() ?? '')
                      : null,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
