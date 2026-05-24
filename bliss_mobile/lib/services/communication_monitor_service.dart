import 'package:cloud_firestore/cloud_firestore.dart';

class CommunicationMonitorService {
  static Future<void> flagBypassAttempt(String userId, String userType, String externalContact) async {
    await FirebaseFirestore.instance.collection('bypass_flags').add({
      'userId': userId,
      'userType': userType,
      'externalContact': externalContact,
      'flaggedAt': FieldValue.serverTimestamp(),
      'reason': 'Attempted external communication bypass',
      'status': 'flagged',
    });
  }

  static Future<void> logInternalCommunication(String fromUserId, String toUserId, String type) async {
    await FirebaseFirestore.instance.collection('communication_logs').add({
      'fromUserId': fromUserId,
      'toUserId': toUserId,
      'type': type, // 'text', 'voice', 'video'
      'timestamp': FieldValue.serverTimestamp(),
      'internal': true,
    });
  }

  static Stream<QuerySnapshot> getBypassFlags() {
    return FirebaseFirestore.instance
        .collection('bypass_flags')
        .orderBy('flaggedAt', descending: true)
        .snapshots();
  }
}