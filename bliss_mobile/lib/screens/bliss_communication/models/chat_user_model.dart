class ChatUserModel {
  final String userId;
  final String name;
  final String role; // employer, agent, candidate, staff
  final String avatar;

  ChatUserModel({
    required this.userId,
    required this.name,
    required this.role,
    required this.avatar,
  });

  factory ChatUserModel.fromMap(Map<String, dynamic> data) {
    return ChatUserModel(
      userId: data['userId'] ?? '',
      name: data['name'] ?? '',
      role: data['role'] ?? '',
      avatar: data['avatar'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'name': name,
      'role': role,
      'avatar': avatar,
    };
  }
}
