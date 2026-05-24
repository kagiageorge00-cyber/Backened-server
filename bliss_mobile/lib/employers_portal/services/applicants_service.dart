import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/application_model.dart';

class ApplicantsService {
  final CollectionReference _applicationsRef;

  ApplicantsService() : _applicationsRef = FirebaseFirestore.instance.collection('applications');

  /// Get all applications for a specific employer
  Stream<List<ApplicationModel>> getApplicationsByEmployer(String employerId) {
    return _applicationsRef
        .where('employerId', isEqualTo: employerId)
        .orderBy('appliedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ApplicationModel.fromDocument(doc))
            .toList());
  }

  /// Get all applications for a specific candidate
  Stream<List<ApplicationModel>> getApplicationsByCandidate(String candidateId) {
    return _applicationsRef
        .where('candidateId', isEqualTo: candidateId)
        .orderBy('appliedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ApplicationModel.fromDocument(doc))
            .toList());
  }

  /// Get a single application by ID
  Future<ApplicationModel?> getApplicationById(String applicationId) async {
    final doc = await _applicationsRef.doc(applicationId).get();
    if (doc.exists) {
      return ApplicationModel.fromDocument(doc);
    }
    return null;
  }

  /// Update application status (applied, interview, hired, rejected)
  Future<void> updateApplicationStatus(String applicationId, String status) async {
    await _applicationsRef.doc(applicationId).update({'status': status});
  }

  /// Unlock candidate documents after hire fees are paid
  Future<void> unlockCandidateDocuments(String applicationId) async {
    await _applicationsRef.doc(applicationId).update({'documentsUnlocked': true});
  }

  /// Reject candidate and send back to candidate marketplace
  Future<void> returnCandidateToMarketplace(String applicationId) async {
    await _applicationsRef.doc(applicationId).update({
      'status': 'returned_to_marketplace',
      'documentsUnlocked': false,
    });
  }
}
