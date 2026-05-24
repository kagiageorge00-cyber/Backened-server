import 'package:cloud_firestore/cloud_firestore.dart';

class GlobalChatMessage {
  final String messageId;
  final String senderId;
  final String senderRole; // employer, agent, candidate, staff
  final String message;
  final Timestamp timestamp;

  GlobalChatMessage({
    required this.messageId,
    required this.senderId,
    required this.senderRole,
    required this.message,
    required this.timestamp,
  });

  factory GlobalChatMessage.fromMap(Map<String, dynamic> data, String id) {
    return GlobalChatMessage(
      messageId: id,
      senderId: data['senderId'] ?? '',
      senderRole: data['senderRole'] ?? '',
      message: data['message'] ?? '',
      timestamp: data['timestamp'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'senderRole': senderRole,
      'message': message,
      'timestamp': timestamp,
    };
  }
}
