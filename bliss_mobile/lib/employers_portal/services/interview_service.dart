import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/interview_model.dart';

class InterviewService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Schedule interview
  Future<String> scheduleInterview(Interview interview) async {
    final docRef = _db.collection('interviews').doc();
    interview.id = docRef.id;
    await docRef.set(interview.toMap());
    return docRef.id;
  }

  // Update interview result
  Future<void> updateInterview(Interview interview) async {
    await _db.collection('interviews').doc(interview.id).update(interview.toMap());
  }

  // Fetch interviews for employer
  Stream<List<Interview>> fetchEmployerInterviews(String employerId) {
    return _db.collection('interviews')
      .where('employerId', isEqualTo: employerId)
      .snapshots()
      .map((snap) => snap.docs.map((d) => Interview.fromMap(d.data())).toList());
  }

  // Fetch interviews for candidate
  Stream<List<Interview>> fetchCandidateInterviews(String candidateId) {
    return _db.collection('interviews')
      .where('candidateId', isEqualTo: candidateId)
      .snapshots()
      .map((snap) => snap.docs.map((d) => Interview.fromMap(d.data())).toList());
  }
}
