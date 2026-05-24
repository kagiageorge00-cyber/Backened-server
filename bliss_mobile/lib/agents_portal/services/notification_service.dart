class NotificationModel {
  final String notificationId;
  final String userId; // agentId or employerId
  final String title;
  final String message;
  final bool read;
  final DateTime createdAt;

  NotificationModel({
    required this.notificationId,
    required this.userId,
    required this.title,
    required this.message,
    this.read = false,
    required this.createdAt,
  });

  factory NotificationModel.fromMap(Map<String, dynamic> data, String id) {
    return NotificationModel(
      notificationId: id,
      userId: data['userId'] ?? '',
      title: data['title'] ?? '',
      message: data['message'] ?? '',
      read: data['read'] ?? false,
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'title': title,
      'message': message,
      'read': read,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  NotificationModel copyWith({
    bool? read,
  }) {
    return NotificationModel(
      notificationId: notificationId,
      userId: userId,
      title: title,
      message: message,
      read: read ?? this.read,
      createdAt: createdAt,
    );
  }
}

class NotificationService {
  // final FirebaseFirestore _db = FirebaseFirestore.instance; // REMOVED: Migrating to backend server
  final String collection = 'notifications';

  // ------------------------
  // Add a new notification
  // ------------------------
  // TODO: Implement addNotification using backend endpoint

  // ------------------------
  // Mark notification as read
  // ------------------------
  // TODO: Implement markAsRead using backend endpoint

  // ------------------------
  // Stream notifications for a user
  // ------------------------
  // TODO: Implement getUserNotifications using backend endpoint

  // ------------------------
  // Count unread notifications
  // ------------------------
  // TODO: Implement getUnreadCount using backend endpoint
}
