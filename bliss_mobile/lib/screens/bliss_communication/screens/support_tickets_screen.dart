import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../services/bliss_communication_service.dart';
import '../models/support_ticket_model.dart';

class SupportTicketsScreen extends StatelessWidget {
  const SupportTicketsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final BlissCommunicationService service = BlissCommunicationService();
    String userId = 'user123'; // Replace with actual logged-in user ID

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text("Support Tickets"),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/createTicket'),
        child: const Icon(Icons.add),
      ),
      body: StreamBuilder<List<SupportTicketModel>>(
        stream: service.ticketsForUserStream(userId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final tickets = snapshot.data ?? [];

          if (tickets.isEmpty) {
            return const Center(child: Text("No support tickets"));
          }

          return ListView.builder(
            itemCount: tickets.length,
            itemBuilder: (context, index) {
              final ticket = tickets[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  title: Text(
                    ticket.message,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text("Status: ${ticket.status}"),
                      const SizedBox(height: 2),
                      Text("Response: ${ticket.adminResponse.isEmpty ? 'Pending' : ticket.adminResponse}"),
                    ],
                  ),
                  trailing: Text(
                    ticket.createdAt.toDate().toLocal().toString().split('.')[0],
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  onTap: () {
                    // Optional: navigate to ticket details screen
                    // Navigator.pushNamed(context, '/ticketDetails', arguments: ticket.ticketId);
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
