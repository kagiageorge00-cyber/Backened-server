// lib/employers_portal/services/interview_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/interview_model.dart';

class InterviewService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String collection = 'interviews';

  /// Schedule a new interview
  Future<void> scheduleInterview(Interview interview) async {
    final docRef = _db.collection(collection).doc(interview.id);
    // Assign doc ID if empty
    if (interview.id.isEmpty) {
      interview.id = docRef.id;
    }
    await docRef.set(interview.toMap());
  }

  /// Update interview status, feedback, or video call link
  Future<void> updateInterview({
    required String interviewId,
    String? status,
    String? feedback,
    String? videoCallLink,
    DateTime? scheduledDate,
    String? scheduledTime,
  }) async {
    final Map<String, dynamic> data = {};
    if (status != null) data['status'] = status;
    if (feedback != null) data['feedback'] = feedback;
    if (videoCallLink != null) data['videoCallLink'] = videoCallLink;
    if (scheduledDate != null) data['scheduledDate'] = Timestamp.fromDate(scheduledDate);
    if (scheduledTime != null) data['scheduledTime'] = scheduledTime;
    data['lastUpdated'] = FieldValue.serverTimestamp();

    if (data.isNotEmpty) {
      await _db.collection(collection).doc(interviewId).update(data);
    }
  }

  /// Stream all interviews for a specific application
  Stream<List<Interview>> getInterviewsByApplication(String applicationId) {
    return _db
        .collection(collection)
        .where('jobId', isEqualTo: applicationId)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Interview.fromMap(doc.data())).toList());
  }

  /// Stream all interviews for a specific candidate
  Stream<List<Interview>> getInterviewsByCandidate(String candidateId) {
    return _db
        .collection(collection)
        .where('candidateId', isEqualTo: candidateId)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Interview.fromMap(doc.data())).toList());
  }

  /// Fetch single interview by ID
  Future<Interview?> getInterviewById(String interviewId) async {
    final doc = await _db.collection(collection).doc(interviewId).get();
    if (!doc.exists) return null;
    return Interview.fromMap(doc.data()!);
  }

  /// Delete an interview
  Future<void> deleteInterview(String interviewId) async {
    await _db.collection(collection).doc(interviewId).delete();
  }
}
