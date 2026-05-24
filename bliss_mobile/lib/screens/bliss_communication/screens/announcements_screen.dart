import 'package:flutter/material.dart';
import '../services/bliss_communication_service.dart';
import '../models/announcement_model.dart';

class AnnouncementsScreen extends StatelessWidget {
  const AnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = BlissCommunicationService();
    String role = 'candidate'; // Replace with actual logged-in user role

    return Scaffold(
      appBar: AppBar(
        title: const Text("Announcements"),
      ),
      body: StreamBuilder<List<AnnouncementModel>>(
        stream: service.announcementsStream(audience: role),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text("No announcements"));
          }

          final announcements = snapshot.data!;

          return ListView.builder(
            itemCount: announcements.length,
            itemBuilder: (context, index) {
              final ann = announcements[index];
              return Card(
                margin: const EdgeInsets.all(10),
                elevation: 3,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ann.title,
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ann.message,
                        style: const TextStyle(fontSize: 16),
                      ),
                      if (ann.attachments.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          "Attachments: ${ann.attachments.join(', ')}",
                          style:
                              const TextStyle(fontSize: 14, color: Colors.blue),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        ann.timestamp.toDate().toString(),
                        style:
                            const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
