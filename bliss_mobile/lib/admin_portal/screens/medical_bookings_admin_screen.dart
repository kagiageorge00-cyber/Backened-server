import 'package:flutter/material.dart';
import '../../services/bliss_medical_service.dart';

class MedicalBookingsAdminScreen extends StatefulWidget {
  const MedicalBookingsAdminScreen({super.key});

  @override
  State<MedicalBookingsAdminScreen> createState() =>
      _MedicalBookingsAdminScreenState();
}

class _MedicalBookingsAdminScreenState
    extends State<MedicalBookingsAdminScreen> {
  late Future<List<dynamic>> _pendingBookingsFuture;

  @override
  void initState() {
    super.initState();
    _pendingBookingsFuture = BlissMedicalService.getPendingBookings();
  }

  Future<void> _verifyBooking(
      Map<String, dynamic> booking, String action) async {
    final dateController = TextEditingController();
    final timeController = TextEditingController();
    final venueController = TextEditingController();
    if (action == 'approve') {
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Assign Slot'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: dateController,
                  decoration:
                      const InputDecoration(labelText: 'Date (YYYY-MM-DD)')),
              TextField(
                  controller: timeController,
                  decoration:
                      const InputDecoration(labelText: 'Time (e.g. 10:00 AM)')),
              TextField(
                  controller: venueController,
                  decoration: const InputDecoration(labelText: 'Venue')),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                await BlissMedicalService.verifyBooking(
                  bookingId: booking['_id'] ?? booking['id'],
                  action: 'approve',
                  date: dateController.text.trim(),
                  time: timeController.text.trim(),
                  venue: venueController.text.trim(),
                );
                Navigator.pop(ctx);
                setState(() {
                  _pendingBookingsFuture =
                      BlissMedicalService.getPendingBookings();
                });
              },
              child: const Text('Confirm'),
            ),
          ],
        ),
      );
    } else {
      await BlissMedicalService.verifyBooking(
        bookingId: booking['_id'] ?? booking['id'],
        action: 'reject',
      );
      setState(() {
        _pendingBookingsFuture = BlissMedicalService.getPendingBookings();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pending Medical Bookings')),
      body: FutureBuilder<List<dynamic>>(
        future: _pendingBookingsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: \\${snapshot.error}'));
          }
          final bookings = snapshot.data ?? [];
          if (bookings.isEmpty) {
            return const Center(child: Text('No pending bookings.'));
          }
          return ListView.builder(
            itemCount: bookings.length,
            itemBuilder: (context, i) {
              final b = bookings[i];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: ListTile(
                  title: Text(b['fullName'] ?? ''),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Phone: \\${b['phone']}'),
                      Text('ID: \\${b['idNumber']}'),
                      Text('Gender: \\${b['gender']}'),
                      Text('DOB: \\${b['dateOfBirth']}'),
                      Text('Transaction: \\${b['transactionCode'] ?? 'N/A'}'),
                      if (b['paymentProofUrl'] != null)
                        Text('Proof: \\${b['paymentProofUrl']}'),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.check, color: Colors.green),
                        onPressed: () => _verifyBooking(b, 'approve'),
                        tooltip: 'Approve',
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.red),
                        onPressed: () => _verifyBooking(b, 'reject'),
                        tooltip: 'Reject',
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
