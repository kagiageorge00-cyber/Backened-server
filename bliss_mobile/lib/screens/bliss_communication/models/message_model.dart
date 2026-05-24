import 'package:cloud_firestore/cloud_firestore.dart';

class MessageModel {
  final String id;
  final String message;
  final String senderId;
  final String senderRole;
  final String? recipientId;
  final DateTime timestamp;
  final List<String> files;

  final bool sent;
  final bool delivered;
  final bool read;

  const MessageModel({
    required this.id,
    required this.message,
    required this.senderId,
    required this.senderRole,
    required this.recipientId,
    required this.timestamp,
    required this.files,
    required this.sent,
    required this.delivered,
    required this.read,
  });

  // -----------------------------
  // FROM FIRESTORE → MODEL
  // -----------------------------
  factory MessageModel.fromMap(Map<String, dynamic> data) {
    return MessageModel(
      id: data["id"] ?? "",
      message: data["message"] ?? "",
      senderId: data["senderId"] ?? "",
      senderRole: data["senderRole"] ?? "",
      recipientId: data["recipientId"],
      timestamp: (data["timestamp"] is Timestamp)
          ? (data["timestamp"] as Timestamp).toDate()
          : DateTime.now(),
      files: List<String>.from(data["files"] ?? []),
      sent: data["sent"] ?? false,
      delivered: data["delivered"] ?? false,
      read: data["read"] ?? false,
    );
  }

  // -----------------------------
  // TO FIRESTORE → MAP
  // -----------------------------
  Map<String, dynamic> toMap() {
    return {
      "id": id,
      "message": message,
      "senderId": senderId,
      "senderRole": senderRole,
      "recipientId": recipientId,
      "timestamp": Timestamp.fromDate(timestamp),
      "files": files,
      "sent": sent,
      "delivered": delivered,
      "read": read,
    };
  }
}
