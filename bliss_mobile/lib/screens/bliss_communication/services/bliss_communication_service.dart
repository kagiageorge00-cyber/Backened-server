// lib/services/bliss_communication_service.dart

import 'dart:typed_data';
import 'dart:io' show File;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

// Models used throughout the service. Ensure these files exist.
import '../models/announcement_model.dart';
import '../models/message_model.dart';
import '../models/private_chat_model.dart';
import '../models/support_ticket_model.dart';
import '../models/notification_model.dart';

class BlissCommunicationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // ---------------------------------------------------------------------------
  // SAFE MAP PARSER (prevents null crashes everywhere)
  // ---------------------------------------------------------------------------
  Map<String, dynamic> safeMap(dynamic raw) {
    if (raw == null) return <String, dynamic>{};
    if (raw is Map<String, dynamic>) return raw;
    return <String, dynamic>{};
  }

  // ---------------------------------------------------------------------------
  // FILE UPLOAD HELPERS (Firebase Storage)
  // ---------------------------------------------------------------------------

  /// Upload a File (mobile/native) to [storagePath] and return download URL.
  Future<String> uploadFile(File file, String storagePath) async {
    final ref = _storage.ref().child(storagePath);
    final uploadTask = ref.putFile(file);
    final snapshot = await uploadTask;
    final url = await snapshot.ref.getDownloadURL();
    return url;
  }

  /// Upload raw bytes (useful for web) to [storagePath] and return download URL.
  Future<String> uploadBytes(Uint8List bytes, String storagePath) async {
    final ref = _storage.ref().child(storagePath);
    final snapshot = await ref.putData(bytes);
    final url = await snapshot.ref.getDownloadURL();
    return url;
  }

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENTS
  // ---------------------------------------------------------------------------
  Future<void> sendAnnouncement(AnnouncementModel announcement) async {
    await _firestore.collection('bliss_announcements').add(announcement.toMap());
  }

  Stream<List<AnnouncementModel>> announcementsStream({String? audience}) {
    Query query = _firestore
        .collection('bliss_announcements')
        .orderBy('timestamp', descending: true);

    if (audience != null) {
      query = query.where('targetAudience', arrayContains: audience);
    }

    return query.snapshots().map((snapshot) {
      final list = <AnnouncementModel>[];
      for (final doc in snapshot.docs) {
        try {
          final raw = doc.data();
          if (raw == null) continue;
          final data = safeMap(raw);
          list.add(AnnouncementModel.fromMap(data, doc.id));
        } catch (_) {
          continue;
        }
      }
      return list;
    });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE CHAT (deterministic chat id, create, send messages, attachments)
  // ---------------------------------------------------------------------------

  /// Build deterministic chatId for two participants (always same order).
  String deterministicChatId(String a, String b) {
    final list = [a, b]..sort();
    return "${list[0]}_${list[1]}";
  }

  /// Ensure the private chat exists (creates if missing) and returns chatId.
  /// Chat doc path: bliss_private_chats/{chatId}
  Future<String> ensurePrivateChatExists(String a, String b) async {
    final chatId = deterministicChatId(a, b);
    final docRef = _firestore.collection('bliss_private_chats').doc(chatId);
    final snapshot = await docRef.get();

    if (!snapshot.exists) {
      await docRef.set({
        'chatId': chatId,
        'participants': [a, b],
        'createdAt': FieldValue.serverTimestamp(),
        'paidByEmployer': false,
        'lastMessage': '',
        'lastMessageTime': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    }

    return chatId;
  }

  /// Create a private chat metadata document from a PrivateChatModel.
  Future<void> createPrivateChat(PrivateChatModel chat) async {
    await _firestore
        .collection('bliss_private_chats')
        .doc(chat.chatId)
        .set(chat.toMap(), SetOptions(merge: true));
  }

  /// Send a MessageModel to the chat's messages subcollection.
  ///
  /// - Ensures message has an id and server timestamp.
  /// - Sets WhatsApp-style tick defaults: sent=true, delivered=false, read=false.
  Future<void> sendPrivateMessage(String chatId, MessageModel message) async {
    final chatRef = _firestore.collection('bliss_private_chats').doc(chatId);
    final msgRef = chatRef.collection('messages').doc();

    // Start from message.toMap() then override id and timestamp to server values.
    final map = message.toMap();

    // override id & timestamp
    map['id'] = msgRef.id;
    map['timestamp'] = FieldValue.serverTimestamp();

    // enforce ticks fields (matching your MessageModel)
    map['sent'] = true;
    map['delivered'] = false;
    map['read'] = false;

    await msgRef.set(map);

    // Update chat metadata (lastMessage + lastMessageTime)
    try {
      await chatRef.update({
        'lastMessage': (message.message.isEmpty && (message.files.isNotEmpty))
            ? '[Attachment]'
            : message.message,
        'lastMessageTime': FieldValue.serverTimestamp(),
      });
    } catch (_) {
      // ignore if parent doc missing; ensurePrivateChatExists should normally prevent this.
    }
  }

  /// Stream of messages for a private chat ordered by timestamp ascending.
  Stream<List<MessageModel>> privateMessagesStream(String chatId) {
    return _firestore
        .collection('bliss_private_chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp')
        .snapshots()
        .map((snapshot) {
      final list = <MessageModel>[];
      for (final doc in snapshot.docs) {
        final raw = safeMap(doc.data());
        final withId = {...raw, 'id': doc.id};
        list.add(MessageModel.fromMap(withId));
      }
      return list;
    });
  }

  /// Stream of private chats where the user is a participant
  Stream<List<PrivateChatModel>> chatsForUserStream(String userId) {
    return _firestore
        .collection('bliss_private_chats')
        .where('participants', arrayContains: userId)
        .snapshots()
        .map((snapshot) {
      final list = <PrivateChatModel>[];
      for (final doc in snapshot.docs) {
        final raw = safeMap(doc.data());
        list.add(PrivateChatModel.fromMap(raw, doc.id));
      }
      return list;
    });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: send image/audio/file helper (uploads to Storage then saves message)
  // ---------------------------------------------------------------------------

  Future<void> sendPrivateImageFile({
    required String fromUserId,
    required String fromUserRole,
    required String toUserId,
    required File imageFile,
    String messageText = '',
  }) async {
    final chatId = await ensurePrivateChatExists(fromUserId, toUserId);

    final path =
        'private_images/$chatId/${DateTime.now().millisecondsSinceEpoch}_$fromUserId.jpg';
    final url = await uploadFile(imageFile, path);

    final message = MessageModel(
      id: '',
      message: messageText,
      senderId: fromUserId,
      senderRole: fromUserRole,
      recipientId: toUserId,
      timestamp: DateTime.now(),
      files: [url],
      sent: true,
      delivered: false,
      read: false,
    );

    await sendPrivateMessage(chatId, message);
  }

  Future<void> sendPrivateAudioFile({
    required String fromUserId,
    required String fromUserRole,
    required String toUserId,
    required File audioFile,
    String messageText = '',
  }) async {
    final chatId = await ensurePrivateChatExists(fromUserId, toUserId);
    final path =
        'private_audio/$chatId/${DateTime.now().millisecondsSinceEpoch}_$fromUserId.mp3';
    final url = await uploadFile(audioFile, path);

    final message = MessageModel(
      id: '',
      message: messageText,
      senderId: fromUserId,
      senderRole: fromUserRole,
      recipientId: toUserId,
      timestamp: DateTime.now(),
      files: [url],
      sent: true,
      delivered: false,
      read: false,
    );

    await sendPrivateMessage(chatId, message);
  }

  Future<void> sendPrivateFile({
    required String fromUserId,
    required String fromUserRole,
    required String toUserId,
    required File file,
    String messageText = '',
  }) async {
    final chatId = await ensurePrivateChatExists(fromUserId, toUserId);
    final filename = file.path.split('/').last;
    final path =
        'private_files/$chatId/${DateTime.now().millisecondsSinceEpoch}_${fromUserId}_$filename';
    final url = await uploadFile(file, path);

    final message = MessageModel(
      id: '',
      message: messageText,
      senderId: fromUserId,
      senderRole: fromUserRole,
      recipientId: toUserId,
      timestamp: DateTime.now(),
      files: [url],
      sent: true,
      delivered: false,
      read: false,
    );

    await sendPrivateMessage(chatId, message);
  }

  // ---------------------------------------------------------------------------
  // READ & DELIVERY TICKS HELPERS (WhatsApp-style)
  // ---------------------------------------------------------------------------

  /// Mark a specific message as delivered (sets delivered=true).
  Future<void> markPrivateMessageDelivered(
      String chatId, String messageId) async {
    await _firestore
        .collection('bliss_private_chats')
        .doc(chatId)
        .collection('messages')
        .doc(messageId)
        .update({'delivered': true});
  }

  /// Mark a specific message as read (sets read=true).
  Future<void> markPrivateMessageRead(String chatId, String messageId) async {
    await _firestore
        .collection('bliss_private_chats')
        .doc(chatId)
        .collection('messages')
        .doc(messageId)
        .update({'read': true});
  }

  /// Mark all messages addressed to myId in chat as read (use when opening chat).
  Future<void> markAllPrivateMessagesAsRead(String chatId, String myId) async {
    final snap = await _firestore
        .collection('bliss_private_chats')
        .doc(chatId)
        .collection('messages')
        .where('recipientId', isEqualTo: myId)
        .where('read', isEqualTo: false)
        .get();

    for (final doc in snap.docs) {
      await doc.reference.update({'read': true});
    }
  }

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS
  // ---------------------------------------------------------------------------
  Future<void> createSupportTicket(SupportTicketModel ticket) async {
    await _firestore.collection('bliss_support_tickets').add(ticket.toMap());
  }

  Future<void> replyToTicket(String ticketId, String adminResponse) async {
    await _firestore.collection('bliss_support_tickets').doc(ticketId).update({
      'adminResponse': adminResponse,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Stream<List<SupportTicketModel>> ticketsForUserStream(String userId) {
    return _firestore
        .collection('bliss_support_tickets')
        .where('createdBy', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      final list = <SupportTicketModel>[];
      for (final doc in snapshot.docs) {
        final raw = safeMap(doc.data());
        list.add(SupportTicketModel.fromMap(raw, doc.id));
      }
      return list;
    });
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------
  Future<void> sendNotification(NotificationModel notification) async {
    await _firestore.collection('bliss_notifications').add(notification.toMap());
  }

  Stream<List<NotificationModel>> notificationsForUserStream(String userId) {
    return _firestore
        .collection('bliss_notifications')
        .where('userId', isEqualTo: userId)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      final list = <NotificationModel>[];
      for (final doc in snapshot.docs) {
        final raw = safeMap(doc.data());
        list.add(NotificationModel.fromMap(raw, doc.id));
      }
      return list;
    });
  }

  Future<void> markNotificationAsRead(String notificationId) async {
    await _firestore
        .collection('bliss_notifications')
        .doc(notificationId)
        .update({'isRead': true});
  }

  // ---------------------------------------------------------------------------
  // GLOBAL CHAT (text + attachments)
  // ---------------------------------------------------------------------------
  Future<void> sendGlobalMessage(MessageModel message) async {
    final map = message.toMap();

    await _firestore.collection('bliss_global_chat').add({
      ...map,
      'delivered': map['delivered'] ?? false,
      'read': map['read'] ?? false,
      'timestamp': map['timestamp'] is Timestamp
          ? map['timestamp']
          : FieldValue.serverTimestamp(),
    });
  }

  Stream<List<MessageModel>> globalMessagesStream() {
    return _firestore
        .collection('bliss_global_chat')
        .orderBy('timestamp')
        .snapshots()
        .map((snapshot) {
      final list = <MessageModel>[];
      for (final doc in snapshot.docs) {
        final raw = safeMap(doc.data());
        final dataWithId = {...raw, 'id': doc.id};
        list.add(MessageModel.fromMap(dataWithId));
      }
      return list;
    });
  }

  Future<void> sendGlobalImage({
    required String senderId,
    required String senderRole,
    required File imageFile,
    String text = '',
  }) async {
    final path =
        'global_images/${DateTime.now().millisecondsSinceEpoch}_$senderId.jpg';
    final url = await uploadFile(imageFile, path);

    final message = MessageModel(
      id: '',
      message: text,
      senderId: senderId,
      senderRole: senderRole,
      recipientId: null,
      timestamp: DateTime.now(),
      files: [url],
      sent: true,
      delivered: false,
      read: false,
    );

    await sendGlobalMessage(message);
  }

  Future<void> sendGlobalAudio({
    required String senderId,
    required String senderRole,
    required File audioFile,
    String text = '',
  }) async {
    final path =
        'global_audio/${DateTime.now().millisecondsSinceEpoch}_$senderId.mp3';
    final url = await uploadFile(audioFile, path);

    final message = MessageModel(
      id: '',
      message: text,
      senderId: senderId,
      senderRole: senderRole,
      recipientId: null,
      timestamp: DateTime.now(),
      files: [url],
      sent: true,
      delivered: false,
      read: false,
    );

    await sendGlobalMessage(message);
  }

  Future<void> sendGlobalFile({
    required String senderId,
    required String senderRole,
    required File file,
    String text = '',
  }) async {
    final filename = file.path.split('/').last;
    final path =
        'global_files/${DateTime.now().millisecondsSinceEpoch}_${senderId}_$filename';
    final url = await uploadFile(file, path);

    final message = MessageModel(
      id: '',
      message: text,
      senderId: senderId,
      senderRole: senderRole,
      recipientId: null,
      timestamp: DateTime.now(),
      files: [url],
      sent: true,
      delivered: false,
      read: false,
    );

    await sendGlobalMessage(message);
  }

  // ---------------------------------------------------------------------------
  // GLOBAL TYPING INDICATOR (simple)
  // ---------------------------------------------------------------------------
  Future<void> updateGlobalTypingStatus(String userId, bool isTyping) async {
    await _firestore.collection('bliss_global_typing').doc(userId).set({
      'isTyping': isTyping,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Stream<bool> listenGlobalTyping(String currentUserId) {
    return _firestore
        .collection('bliss_global_typing')
        .snapshots()
        .map((snapshot) {
      for (final doc in snapshot.docs) {
        if (doc.id == currentUserId) continue;

        final raw = doc.data();

        final data = safeMap(raw);

        if (data['isTyping'] == true) {
          return true;
        }
      }
      return false;
    });
  }

  // ---------------------------------------------------------------------------
  // READ & DELIVERY RECEIPTS FOR GLOBAL CHAT (optional helpers)
  // ---------------------------------------------------------------------------
  Future<void> markGlobalMessageDelivered(String messageId) async {
    await _firestore
        .collection('bliss_global_chat')
        .doc(messageId)
        .update({'delivered': true});
  }

  Future<void> markGlobalMessageRead(String messageId) async {
    await _firestore
        .collection('bliss_global_chat')
        .doc(messageId)
        .update({'read': true});
  }
}
