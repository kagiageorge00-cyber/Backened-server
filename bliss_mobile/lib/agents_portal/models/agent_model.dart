class AgentModel {
  final String agentId;
  final String fullName;
  final String email;
  final String phone;
  final String profilePhotoUrl;
  final bool subscriptionActive;
  final DateTime subscriptionEnd;
  final double rating;
  final DateTime createdAt;

  AgentModel({
    required this.agentId,
    required this.fullName,
    required this.email,
    required this.phone,
    this.profilePhotoUrl = '',
    this.subscriptionActive = false,
    required this.subscriptionEnd,
    this.rating = 0.0,
    required this.createdAt,
  });

  // ------------------------
  // Factory method to create Agent from Firestore Document
  // ------------------------
  factory AgentModel.fromMap(Map<String, dynamic> data, String id) {
    return AgentModel(
      agentId: id,
      fullName: data['fullName'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      profilePhotoUrl: data['profilePhotoUrl'] ?? '',
      subscriptionActive: data['subscriptionActive'] ?? false,
      subscriptionEnd: data['subscriptionEnd'] is String
          ? DateTime.parse(data['subscriptionEnd'])
          : DateTime.now(),
      rating:
          (data['rating'] != null) ? (data['rating'] as num).toDouble() : 0.0,
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
    );
  }

  // ------------------------
  // Convert Agent to Firestore Map
  // ------------------------
  Map<String, dynamic> toMap() {
    return {
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'profilePhotoUrl': profilePhotoUrl,
      'subscriptionActive': subscriptionActive,
      'subscriptionEnd': subscriptionEnd.toIso8601String(),
      'rating': rating,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ------------------------
  // Update subscription status
  // ------------------------
  AgentModel copyWith({
    bool? subscriptionActive,
    DateTime? subscriptionEnd,
    double? rating,
    String? profilePhotoUrl,
  }) {
    return AgentModel(
      agentId: agentId,
      fullName: fullName,
      email: email,
      phone: phone,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      subscriptionActive: subscriptionActive ?? this.subscriptionActive,
      subscriptionEnd: subscriptionEnd ?? this.subscriptionEnd,
      rating: rating ?? this.rating,
      createdAt: createdAt,
    );
  }
}
