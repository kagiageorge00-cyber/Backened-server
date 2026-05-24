import 'package:cloud_firestore/cloud_firestore.dart';

enum MedicalServiceType { generalCheckup, vaccination, dental, eye, specialist }

enum MedicalAppointmentStatus { pending, confirmed, completed, cancelled }

class MedicalAppointment {
  final String id;
  final String userId;
  final String patientName;
  final String patientAge;
  final MedicalServiceType serviceType;
  final String doctorName;
  final String clinicName;
  final DateTime appointmentDate;
  final String appointmentTime;
  final double fees;
  final MedicalAppointmentStatus status;
  final String? notes;
  final List<String>? prescriptions;
  final DateTime bookingDate;

  MedicalAppointment({
    required this.id,
    required this.userId,
    required this.patientName,
    required this.patientAge,
    required this.serviceType,
    required this.doctorName,
    required this.clinicName,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.fees,
    required this.status,
    this.notes,
    this.prescriptions,
    required this.bookingDate,
  });

  factory MedicalAppointment.fromMap(Map<String, dynamic> data, String id) {
    return MedicalAppointment(
      id: id,
      userId: data['userId'] ?? '',
      patientName: data['patientName'] ?? '',
      patientAge: data['patientAge'] ?? '',
      serviceType: MedicalServiceType.values[data['serviceType'] ?? 0],
      doctorName: data['doctorName'] ?? '',
      clinicName: data['clinicName'] ?? '',
      appointmentDate: data['appointmentDate'] != null
          ? DateTime.parse(data['appointmentDate'])
          : DateTime.now(),
      appointmentTime: data['appointmentTime'] ?? '',
      fees: data['fees']?.toDouble() ?? 0.0,
      status: MedicalAppointmentStatus.values[data['status'] ?? 0],
      notes: data['notes'],
      prescriptions: List<String>.from(data['prescriptions'] ?? []),
      bookingDate: data['bookingDate'] != null
          ? DateTime.parse(data['bookingDate'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'patientName': patientName,
      'patientAge': patientAge,
      'serviceType': serviceType.index,
      'doctorName': doctorName,
      'clinicName': clinicName,
      'appointmentDate': appointmentDate.toIso8601String(),
      'appointmentTime': appointmentTime,
      'fees': fees,
      'status': status.index,
      'notes': notes,
      'prescriptions': prescriptions,
      'bookingDate': bookingDate.toIso8601String(),
    };
  }
}

class MedicalService {
  static final MedicalService _instance = MedicalService._internal();
  final _firestore = FirebaseFirestore.instance;

  factory MedicalService() {
    return _instance;
  }

  MedicalService._internal();

  /// Medical service fees
  static const Map<String, double> serviceFees = {
    'generalCheckup': 30.0,
    'vaccination': 20.0,
    'dental': 50.0,
    'eye': 40.0,
    'specialist': 75.0,
  };

  /// Available doctors (mock data - integrate with real system)
  static const List<String> doctors = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Amara Okonkwo',
    'Dr. David Smith',
    'Dr. Elena Rodriguez',
  ];

  /// Available clinics
  static const List<String> clinics = [
    'Central Medical Clinic',
    'Downtown Health Center',
    'Express Medical Care',
    'Premier Health Services',
  ];

  /// Book medical appointment
  Future<String> bookAppointment({
    required String userId,
    required String patientName,
    required String patientAge,
    required MedicalServiceType serviceType,
    required String doctorName,
    required String clinicName,
    required DateTime appointmentDate,
    required String appointmentTime,
  }) async {
    try {
      final fees = serviceFees[serviceType.toString().split('.').last] ?? 0.0;

      final appointment = MedicalAppointment(
        id: '',
        userId: userId,
        patientName: patientName,
        patientAge: patientAge,
        serviceType: serviceType,
        doctorName: doctorName,
        clinicName: clinicName,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        fees: fees,
        status: MedicalAppointmentStatus.pending,
        bookingDate: DateTime.now(),
      );

      final docRef = await _firestore
          .collection('medical_appointments')
          .add(appointment.toMap());

      debugPrint('✅ Medical appointment booked: ${docRef.id}');
      return docRef.id;
    } catch (e) {
      debugPrint('❌ Error booking appointment: $e');
      rethrow;
    }
  }

  /// Get user's appointments
  Future<List<MedicalAppointment>> getUserAppointments(String userId) async {
    try {
      final query = await _firestore
          .collection('medical_appointments')
          .where('userId', isEqualTo: userId)
          .orderBy('appointmentDate', descending: true)
          .get();

      return query.docs
          .map((doc) => MedicalAppointment.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      debugPrint('❌ Error getting appointments: $e');
      return [];
    }
  }

  /// Confirm appointment (clinic staff/admin)
  Future<void> confirmAppointment(String appointmentId) async {
    try {
      await _firestore
          .collection('medical_appointments')
          .doc(appointmentId)
          .update({'status': MedicalAppointmentStatus.confirmed.index});

      debugPrint('✅ Appointment confirmed: $appointmentId');
    } catch (e) {
      debugPrint('❌ Error confirming appointment: $e');
      rethrow;
    }
  }

  /// Complete appointment with notes
  Future<void> completeAppointment({
    required String appointmentId,
    String? notes,
    List<String>? prescriptions,
  }) async {
    try {
      await _firestore
          .collection('medical_appointments')
          .doc(appointmentId)
          .update({
        'status': MedicalAppointmentStatus.completed.index,
        'notes': notes,
        'prescriptions': prescriptions,
      });

      debugPrint('✅ Appointment completed: $appointmentId');
    } catch (e) {
      debugPrint('❌ Error completing appointment: $e');
      rethrow;
    }
  }

  /// Cancel appointment
  Future<void> cancelAppointment(String appointmentId) async {
    try {
      await _firestore
          .collection('medical_appointments')
          .doc(appointmentId)
          .update({'status': MedicalAppointmentStatus.cancelled.index});

      debugPrint('✅ Appointment cancelled: $appointmentId');
    } catch (e) {
      debugPrint('❌ Error cancelling appointment: $e');
      rethrow;
    }
  }

  /// Get appointment statistics
  Future<Map<String, dynamic>> getAppointmentStats() async {
    try {
      final appointments = await _firestore.collection('medical_appointments').get();

      int total = appointments.size;
      int completed = 0;
      int pending = 0;
      double totalRevenue = 0.0;

      for (var doc in appointments.docs) {
        final data = doc.data();
        final status = MedicalAppointmentStatus.values[data['status'] ?? 0];
        final fees = data['fees']?.toDouble() ?? 0.0;

        totalRevenue += fees;

        if (status == MedicalAppointmentStatus.completed) {
          completed++;
        } else if (status == MedicalAppointmentStatus.pending) {
          pending++;
        }
      }

      return {
        'total': total,
        'completed': completed,
        'pending': pending,
        'totalRevenue': totalRevenue,
      };
    } catch (e) {
      debugPrint('❌ Error getting statistics: $e');
      return {};
    }
  }
}

void debugPrint(String message) {
  print('[MedicalService] $message');
}
