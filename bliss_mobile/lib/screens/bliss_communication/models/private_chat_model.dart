import 'message_model.dart';

class PrivateChatModel {
  final String chatId;
  final List<String> participants; // user IDs
  final List<MessageModel> messages; // Optional local cache

  PrivateChatModel({
    required this.chatId,
    required this.participants,
    this.messages = const [],
  });

  factory PrivateChatModel.fromMap(Map<String, dynamic> data, String id) {
    return PrivateChatModel(
      chatId: id,
      participants: List<String>.from(data['participants'] ?? []),

      // Since MessageModel.fromMap takes only 1 argument,
      // we must inject the ID into the map manually
      messages: (data['messages'] as List<dynamic>?)
              ?.map((msg) {
                final map = Map<String, dynamic>.from(msg);
                map['id'] = map['id'] ?? "";
                return MessageModel.fromMap(map);
              })
              .toList()
          ?? [],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'participants': participants,
      // Messages are stored in a subcollection, but this keeps it safe
      'messages': messages.map((e) => e.toMap()).toList(),
    };
  }
}
