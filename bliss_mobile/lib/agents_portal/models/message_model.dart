class MessageModel {
  final String messageId;
  final String chatId;
  final String senderId;
  final String senderType; // candidate, employer, agent, general
  final String text;
  final DateTime createdAt;

  MessageModel({
    required this.messageId,
    required this.chatId,
    required this.senderId,
    required this.senderType,
    required this.text,
    required this.createdAt,
  });

  factory MessageModel.fromMap(Map<String, dynamic> data, String id) {
    return MessageModel(
      messageId: id,
      chatId: data['chatId'] ?? '',
      senderId: data['senderId'] ?? '',
      senderType: data['senderType'] ?? 'general',
      text: data['text'] ?? '',
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
    );
  }
}
