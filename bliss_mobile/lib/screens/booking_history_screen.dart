import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:bliss_mobile/firebase_stub.dart';
import 'package:bliss_mobile/services/auth_service.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> {
  final _authService = AuthService();
  final _firestore = FirebaseFirestore.instance;
  String _selectedTab = 'flights';
  String? _userId;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _getUserId();
  }

  Future<void> _getUserId() async {
    final user = await _authService.getCurrentUserAsync();
    setState(() {
      _userId = user?.uid;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('📋 Booking History'),
        centerTitle: true,
        backgroundColor: Colors.deepPurple,
      ),
      body: _isLoading || _userId == null
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Tab selector
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        _buildTabButton('Flights', 'flights'),
                        _buildTabButton('Hotels', 'hotels'),
                        _buildTabButton('Visas', 'visas'),
                        _buildTabButton('Medical', 'medical'),
                      ],
                    ),
                  ),
                ),
                // Content
                Expanded(
                  child: _buildContent(),
                ),
              ],
            ),
    );
  }

  Widget _buildTabButton(String label, String tab) {
    final isActive = _selectedTab == tab;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4.0),
      child: ElevatedButton(
        onPressed: () => setState(() => _selectedTab = tab),
        style: ElevatedButton.styleFrom(
          backgroundColor: isActive ? Colors.deepPurple : Colors.grey[300],
          foregroundColor: isActive ? Colors.white : Colors.black,
        ),
        child: Text(label),
      ),
    );
  }

  Widget _buildContent() {
    switch (_selectedTab) {
      case 'flights':
        return _buildFlightHistory();
      case 'hotels':
        return _buildHotelHistory();
      case 'visas':
        return _buildVisaHistory();
      case 'medical':
        return _buildMedicalHistory();
      default:
        return const SizedBox();
    }
  }

  Widget _buildFlightHistory() {
    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection('flight_bookings')
          .where('userId', isEqualTo: _userId)
          .orderBy('bookingDate', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final bookings = snapshot.data!.docs;
        if (bookings.isEmpty) {
          return const Center(
            child: Text('No flight bookings yet'),
          );
        }

        return ListView.builder(
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final booking = bookings[index];
            final data = booking.data();
            return _buildBookingCard(
              title: '✈️ ${data['flightNumber'] ?? 'Flight'}',
              route: '${data['origin']} → ${data['destination']}',
              date: data['departureDate'],
              price: data['price']?.toString() ?? '0',
              status: data['status'] ?? 'pending',
            );
          },
        );
      },
    );
  }

  Widget _buildHotelHistory() {
    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection('hotel_bookings')
          .where('userId', isEqualTo: _userId)
          .orderBy('checkInDate', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final bookings = snapshot.data!.docs;
        if (bookings.isEmpty) {
          return const Center(
            child: Text('No hotel bookings yet'),
          );
        }

        return ListView.builder(
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final booking = bookings[index];
            final data = booking.data();
            return _buildBookingCard(
              title: '🏨 ${data['hotelName'] ?? 'Hotel'}',
              route: data['city'] ?? 'Unknown',
              date: data['checkInDate'],
              price: data['price']?.toString() ?? '0',
              status: data['status'] ?? 'pending',
            );
          },
        );
      },
    );
  }

  Widget _buildVisaHistory() {
    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection('visa_applications')
          .where('userId', isEqualTo: _userId)
          .orderBy('applicationDate', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final applications = snapshot.data!.docs;
        if (applications.isEmpty) {
          return const Center(
            child: Text('No visa applications yet'),
          );
        }

        return ListView.builder(
          itemCount: applications.length,
          itemBuilder: (context, index) {
            final app = applications[index];
            final data = app.data();
            final statuses = ['pending', 'reviewing', 'approved', 'rejected'];
            final status = statuses[data['status'] ?? 0];

            return _buildBookingCard(
              title: '🛂 ${data['destinationCountry'] ?? 'Visa'}',
              route: 'Type: ${data['visaType'] ?? 'Unknown'}',
              date: data['applicationDate'],
              price: '${data['applicationFee'] ?? 0}',
              status: status,
            );
          },
        );
      },
    );
  }

  Widget _buildMedicalHistory() {
    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection('medical_appointments')
          .where('userId', isEqualTo: _userId)
          .orderBy('appointmentDate', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final appointments = snapshot.data!.docs;
        if (appointments.isEmpty) {
          return const Center(
            child: Text('No medical appointments yet'),
          );
        }

        return ListView.builder(
          itemCount: appointments.length,
          itemBuilder: (context, index) {
            final apt = appointments[index];
            final data = apt.data();
            final statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
            final status = statuses[data['status'] ?? 0];

            return _buildBookingCard(
              title: '🏥 ${data['clinicName'] ?? 'Medical'}',
              route: 'Dr. ${data['doctorName'] ?? 'Unknown'}',
              date: data['appointmentDate'],
              price: '${data['fees'] ?? 0}',
              status: status,
            );
          },
        );
      },
    );
  }

  Widget _buildBookingCard({
    required String title,
    required String route,
    required dynamic date,
    required String price,
    required String status,
  }) {
    final dateStr = date is String
        ? DateFormat('MMM dd, yyyy').format(DateTime.parse(date))
        : date is DateTime
            ? DateFormat('MMM dd, yyyy').format(date)
            : 'N/A';

    final statusColor = _getStatusColor(status);

    return Card(
      margin: const EdgeInsets.all(8.0),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              route,
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  '\$$price',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'approved':
        return Colors.green;
      case 'completed':
        return Colors.green;
      case 'rejected':
      case 'cancelled':
        return Colors.red;
      case 'reviewing':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}
