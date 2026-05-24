// lib/employers_portal/services/applicants_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/application_model.dart';

class ApplicantsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String collection = 'applications';

  /// Create a new application
  Future<void> createApplication(ApplicationModel application) async {
    await _db.collection(collection).doc(application.id).set(application.toMap());
  }

  /// Update the status of an application
  Future<void> updateApplicationStatus(String applicationId, String status) async {
    await _db
        .collection(collection)
        .doc(applicationId)
        .update({'applicationStatus': status, 'lastUpdated': FieldValue.serverTimestamp()});
  }

  /// Update interview details
  Future<void> updateInterview({
    required String applicationId,
    required bool scheduled,
    DateTime? interviewDate,
    String interviewStatus = 'Pending',
  }) async {
    await _db.collection(collection).doc(applicationId).update({
      'interviewScheduled': scheduled,
      'interviewDate': interviewDate != null ? Timestamp.fromDate(interviewDate) : null,
      'interviewStatus': interviewStatus,
      'lastUpdated': FieldValue.serverTimestamp(),
    });
  }

  /// Update hiring details
  Future<void> updateHiring({
    required String applicationId,
    required bool isHired,
    bool hireFeesPaid = false,
    DateTime? hireDate,
  }) async {
    await _db.collection(collection).doc(applicationId).update({
      'isHired': isHired,
      'hireFeesPaid': hireFeesPaid,
      'hireDate': hireDate != null ? Timestamp.fromDate(hireDate) : null,
      'lastUpdated': FieldValue.serverTimestamp(),
    });
  }

  /// Add or update candidate documents
  Future<void> updateDocuments(String applicationId, Map<String, String> documents) async {
    await _db.collection(collection).doc(applicationId).update({
      'documents': documents,
      'lastUpdated': FieldValue.serverTimestamp(),
    });
  }

  /// Stream applications by job ID
  Stream<List<ApplicationModel>> getApplicationsByJob(String jobId) {
    return _db
        .collection(collection)
        .where('jobId', isEqualTo: jobId)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ApplicationModel.fromDocument(doc))
            .toList());
  }

  /// Stream applications by candidate ID
  Stream<List<ApplicationModel>> getApplicationsByCandidate(String candidateId) {
    return _db
        .collection(collection)
        .where('candidateId', isEqualTo: candidateId)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ApplicationModel.fromDocument(doc))
            .toList());
  }

  /// Fetch single application
  Future<ApplicationModel?> getApplicationById(String applicationId) async {
    final doc = await _db.collection(collection).doc(applicationId).get();
    if (!doc.exists) return null;
    return ApplicationModel.fromDocument(doc);
  }
}
