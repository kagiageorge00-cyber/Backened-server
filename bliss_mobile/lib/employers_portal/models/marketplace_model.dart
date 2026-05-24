import 'package:cloud_firestore/cloud_firestore.dart';

class MarketplaceModel {
  final String id;
  final String candidateId;
  final String employerId;
  final double hireFee;
  final bool hirePaid;
  final bool documentsUnlocked;
  final String status; // e.g., "deployed", "available"
  final DateTime? deploymentDate;
  final DateTime postedAt;

  MarketplaceModel({
    required this.id,
    required this.candidateId,
    required this.employerId,
    required this.hireFee,
    this.hirePaid = false,
    this.documentsUnlocked = false,
    this.status = 'available',
    this.deploymentDate,
    required this.postedAt,
  });

  /// Convert MarketplaceModel → Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'candidateId': candidateId,
      'employerId': employerId,
      'hireFee': hireFee,
      'hirePaid': hirePaid,
      'documentsUnlocked': documentsUnlocked,
      'status': status,
      'deploymentDate': deploymentDate?.toIso8601String(),
      'postedAt': postedAt.toIso8601String(),
    };
  }

  /// Convert Firestore document → MarketplaceModel
  factory MarketplaceModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return MarketplaceModel(
      id: doc.id,
      candidateId: data['candidateId'] ?? '',
      employerId: data['employerId'] ?? '',
      hireFee: (data['hireFee'] ?? 0).toDouble(),
      hirePaid: data['hirePaid'] ?? false,
      documentsUnlocked: data['documentsUnlocked'] ?? false,
      status: data['status'] ?? 'available',
      deploymentDate: data['deploymentDate'] != null
          ? DateTime.parse(data['deploymentDate'])
          : null,
      postedAt: data['postedAt'] != null
          ? DateTime.parse(data['postedAt'])
          : DateTime.now(),
    );
  }
}
