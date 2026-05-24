import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:bliss_mobile/employers_portal/models/job_model.dart';

class JobMarketplaceScreen extends StatelessWidget {
  const JobMarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Job Marketplace"),
        backgroundColor: Colors.blue,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('marketplace')
            .orderBy('postedAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No jobs available.'));
          }
          final jobs = snapshot.data!.docs
              .map((doc) => Job.fromDocument(doc))
              .toList();
          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: jobs.length,
            itemBuilder: (context, index) {
              final job = jobs[index];
              return Card(
                elevation: 3,
                margin: const EdgeInsets.only(bottom: 16),
                child: ListTile(
                  title: Text(job.title),
                  subtitle: Text('Location: ${job.location}\nSalary: ${job.salary}'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    // TODO: Open job details
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
