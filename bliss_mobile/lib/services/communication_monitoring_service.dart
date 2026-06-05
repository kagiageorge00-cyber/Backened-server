import 'package:bliss_mobile/firebase_stub.dart';

class CommunicationMonitoringService {
  static Future<void> logInternalCommunication(
      String fromId, String toId, String message) async {
    await FirebaseFirestore.instance.collection('communications').add({
      'fromId': fromId,
      'toId': toId,
      'message': message,
      'timestamp': FieldValue.serverTimestamp(),
      'type': 'internal',
    });
  }

  static Future<void> flagBypassAttempt(
      String userId, String externalContact) async {
    await FirebaseFirestore.instance.collection('flags').add({
      'userId': userId,
      'externalContact': externalContact,
      'reason': 'bypass_attempt',
      'timestamp': FieldValue.serverTimestamp(),
    });
  }
}
