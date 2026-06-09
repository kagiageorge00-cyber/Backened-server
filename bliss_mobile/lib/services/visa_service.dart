import 'package:bliss_mobile/firebase_stub.dart';

enum VisaType { tourist, student, work, business, transit }

enum VisaStatus { pending, documentsReview, approved, rejected, completed }

class VisaApplication {
  final String id;
  final String userId;
  final String firstName;
  final String lastName;
  final String passportNumber;
  final String destinationCountry;
  final VisaType visaType;
  final VisaStatus status;
  final double applicationFee;
  final DateTime applicationDate;
  final DateTime? approvalDate;
  final List<String> uploadedDocuments;
  final String? rejectionReason;
  final Map<String, dynamic>? metadata;

  VisaApplication({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.passportNumber,
    required this.destinationCountry,
    required this.visaType,
    required this.status,
    required this.applicationFee,
    required this.applicationDate,
    this.approvalDate,
    required this.uploadedDocuments,
    this.rejectionReason,
    this.metadata,
  });

  factory VisaApplication.fromMap(Map<String, dynamic> data, String id) {
    return VisaApplication(
      id: id,
      userId: data['userId'] ?? '',
      firstName: data['firstName'] ?? '',
      lastName: data['lastName'] ?? '',
      passportNumber: data['passportNumber'] ?? '',
      destinationCountry: data['destinationCountry'] ?? '',
      visaType: VisaType.values[data['visaType'] ?? 0],
      status: VisaStatus.values[data['status'] ?? 0],
      applicationFee: data['applicationFee']?.toDouble() ?? 0.0,
      applicationDate: data['applicationDate'] != null
          ? DateTime.parse(data['applicationDate'])
          : DateTime.now(),
      approvalDate: data['approvalDate'] != null
          ? DateTime.parse(data['approvalDate'])
          : null,
      uploadedDocuments: List<String>.from(data['uploadedDocuments'] ?? []),
      rejectionReason: data['rejectionReason'],
      metadata: data['metadata'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'firstName': firstName,
      'lastName': lastName,
      'passportNumber': passportNumber,
      'destinationCountry': destinationCountry,
      'visaType': visaType.index,
      'status': status.index,
      'applicationFee': applicationFee,
      'applicationDate': applicationDate.toIso8601String(),
      'approvalDate': approvalDate?.toIso8601String(),
      'uploadedDocuments': uploadedDocuments,
      'rejectionReason': rejectionReason,
      'metadata': metadata,
    };
  }
}


import 'dart:convert';
import 'package:http/http.dart' as http;

class VisaService {
  static final VisaService _instance = VisaService._internal();

  factory VisaService() {
    return _instance;
  }

  VisaService._internal();

  /// Visa application fees by type and destination
  static const Map<String, double> visaFees = {
    'tourist_standard': 50.0,
    'tourist_rush': 100.0,
    'student_standard': 75.0,
    'student_rush': 150.0,
    'work_standard': 150.0,
    'work_rush': 250.0,
    'business_standard': 100.0,
    'business_rush': 200.0,
  };

  /// Create new visa application (migrated to backend HTTP)
  Future<String> createVisaApplication({
    required String userId,
    required String firstName,
    required String lastName,
    required String passportNumber,
    required String destinationCountry,
    required VisaType visaType,
    required double fee,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/visa-applications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'firstName': firstName,
          'lastName': lastName,
          'passportNumber': passportNumber,
          'destinationCountry': destinationCountry,
          'visaType': visaType.toString(),
          'fee': fee,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data['id'] ?? '';
      } else {
        throw Exception('Failed to create visa application');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Upload document for visa application (migrated to backend HTTP)
  Future<void> uploadDocument({
    required String applicationId,
    required String documentPath,
    required String documentType, // passport, photo, cover_letter, etc.
  }) async {
    try {
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/visa-applications/upload-document'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'applicationId': applicationId,
          'documentPath': documentPath,
          'documentType': documentType,
        }),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to upload document');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's visa applications (migrated to backend HTTP)
  Future<List<VisaApplication>> getUserVisaApplications(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/visa-applications/list'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // You may need to adjust this depending on your backend response
        return (data['applications'] as List)
            .map((app) => VisaApplication.fromMap(app))
            .toList();
      } else {
        throw Exception('Failed to fetch visa applications');
      }
    } catch (e) {
      rethrow;
    }
  }
      final query = await _firestore
          .collection('visa_applications')
          .where('userId', isEqualTo: userId)
          .orderBy('applicationDate', descending: true)
          .get();

      return query.docs
          .void map((doc) => VisaApplication.fromMap(doc.data(), doc.id))
          .toList();
    } void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> void List<dynamic> List<dynamic> catch (e) {
      debugPrint('❌ Error getting visa applications: $e');
      return [];
    }
  }

  /// Review visa application (staff/admin only)
  Future<void> reviewVisaApplication({
    required String applicationId,
    required VisaStatus newStatus,
    String? rejectionReason,
  }) async {
    try {
      final updates = <String, dynamic>{
        'status': newStatus.index,
      };

      if (newStatus == VisaStatus.approved) {
        updates['approvalDate'] = DateTime.now().toIso8601String();
      }

      if (newStatus == VisaStatus.rejected && rejectionReason != null) {
        updates['rejectionReason'] = rejectionReason;
      }

      await _firestore
          .collection('visa_applications')
          .doc(applicationId)
          .update(updates);

      debugPrint(
          '✅ Visa application reviewed: $applicationId → ${newStatus.toString()}');
    } catch (e) {
      debugPrint('❌ Error reviewing visa application: $e');
      rethrow;
    }
  }

  /// Get pending visa applications (staff/admin)
  Future<List<VisaApplication>> getPendingApplications() async {
    try {
      final query = await _firestore
          .collection('visa_applications')
          .where('status', isEqualTo: VisaStatus.pending.index)
          .orderBy('applicationDate')
          .get();

      return query.docs
          .map((doc) => VisaApplication.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      debugPrint('❌ Error getting pending applications: $e');
      return [];
    }
  }

  /// Get all visa applications by destination (for analytics)
  Future<Map<String, int>> getApplicationsByDestination() async {
    try {
      final query = await _firestore.collection('visa_applications').get();
      final Map<String, int> counts = {};

      for (var doc in query.docs) {
        final destination = doc['destinationCountry'] ?? 'Unknown';
        counts[destination] = (counts[destination] ?? 0) + 1;
      }

      return counts;
    } catch (e) {
      debugPrint('❌ Error getting applications by destination: $e');
      return {};
    }
  }

  /// Get visa statistics (admin/staff)
  Future<Map<String, dynamic>> getVisaStatistics() async {
    try {
      final applications = await _firestore.collection('visa_applications').get();

      int total = applications.size;
      int approved = 0;
      int rejected = 0;
      int pending = 0;
      double totalRevenue = 0.0;

      for (var doc in applications.docs) {
        final data = doc.data();
        final status = VisaStatus.values[data['status'] ?? 0];
        final fee = data['applicationFee']?.toDouble() ?? 0.0;

        totalRevenue += fee;

        switch (status) {
          case VisaStatus.approved:
            approved++;
            break;
          case VisaStatus.rejected:
            rejected++;
            break;
          case VisaStatus.pending:
            pending++;
            break;
          default:
            break;
        }
      }

      return {
        'total': total,
        'approved': approved,
        'rejected': rejected,
        'pending': pending,
        'totalRevenue': totalRevenue,
        'approvalRate': total > 0 ? (approved / total * 100).toStringAsFixed(2) : '0',
      };
    } catch (e) {
      debugPrint('❌ Error getting visa statistics: $e');
      return {};
    }
  }
}

void debugPrint(String message) {
  print('[VisaService] $message');
}
