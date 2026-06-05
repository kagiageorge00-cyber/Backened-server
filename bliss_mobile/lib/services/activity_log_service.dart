import 'package:bliss_mobile/firebase_stub.dart';

class ActivityLogService {
  static final CollectionReference logs =
      FirebaseFirestore.instance.collection('activity_logs');

  static Future<void> log({
    required String
        type, // e.g. job_creation, candidate_stage, employer_action, admin_action, login, deployment_update
    required String actorId,
    required String actorRole,
    required String description,
    Map<String, dynamic>? details,
  }) async {
    await logs.add({
      'type': type,
      'actorId': actorId,
      'actorRole': actorRole,
      'description': description,
      'details': details ?? {},
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  static Stream<QuerySnapshot> getLogs({int limit = 100}) {
    return logs.orderBy('timestamp', descending: true).limit(limit).snapshots();
  }

  static Stream<QuerySnapshot> getLogsByType(String type, {int limit = 100}) {
    return logs
        .where('type', isEqualTo: type)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots();
  }
}
