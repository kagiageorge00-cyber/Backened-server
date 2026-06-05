import 'user_role.dart';

class User {
  bool get isVerified => kycVerified;
  final String uid;
  final String email;
  final String? displayName;
  final UserRole role;
  final bool kycVerified;
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;

  User({
    required this.uid,
    required this.email,
    this.displayName,
    required this.role,
    this.kycVerified = false,
    required this.createdAt,
    this.metadata,
  });

  factory User.fromMap(Map<String, dynamic> data, String uid) {
    return User(
      uid: uid,
      email: data['email'] ?? '',
      displayName: data['displayName'],
      role: UserRole.fromString(data['role'] ?? 'candidate'),
      kycVerified: data['kycVerified'] ?? false,
      createdAt: data['createdAt'] != null
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
      metadata: data['metadata'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'role': role.value,
      'kycVerified': kycVerified,
      'createdAt': createdAt.toIso8601String(),
      'metadata': metadata,
    };
  }

  User copyWith({
    String? uid,
    String? email,
    String? displayName,
    UserRole? role,
    bool? kycVerified,
    DateTime? createdAt,
    Map<String, dynamic>? metadata,
  }) {
    return User(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      role: role ?? this.role,
      kycVerified: kycVerified ?? this.kycVerified,
      createdAt: createdAt ?? this.createdAt,
      metadata: metadata ?? this.metadata,
    );
  }
}
