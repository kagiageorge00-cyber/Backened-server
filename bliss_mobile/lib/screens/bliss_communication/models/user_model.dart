
class UserModel {
  final String id;
  final String name;
  final String role; // candidate / employer / agent / staff
  final String profilePictureUrl;

  UserModel({
    required this.id,
    required this.name,
    required this.role,
    required this.profilePictureUrl,
  });

  factory UserModel.fromMap(Map<String, dynamic> data, String id) {
    return UserModel(
      id: id,
      name: data['name'] ?? '',
      role: data['role'] ?? '',
      profilePictureUrl: data['profilePictureUrl'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'role': role,
      'profilePictureUrl': profilePictureUrl,
    };
  }
}
