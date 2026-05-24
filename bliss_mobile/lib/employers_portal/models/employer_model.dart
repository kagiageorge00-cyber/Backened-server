// lib/employers_portal/models/employer_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class Employer {
  final String id;
  final String? companyName;
  final String email;
  final String? phone;
  final String? address;
  final bool verified;
  final bool suspended;
  final String status;
  final double walletBalance;
  final int totalHires;
  final int totalInterviews;
  final Map<String, dynamic> documents;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Employer({
    required this.id,
    this.companyName,
    required this.email,
    this.phone,
    this.address,
    this.verified = false,
    this.suspended = false,
    this.status = 'active',
    this.walletBalance = 0.0,
    this.totalHires = 0,
    this.totalInterviews = 0,
    this.documents = const {},
    required this.createdAt,
    this.updatedAt,
  });

  /// Convert Firestore Map → Employer
  factory Employer.fromMap(Map<String, dynamic> map, String id) {
    return Employer(
      id: id,
      companyName: map['companyName'],
      email: map['email'] ?? '',
      phone: map['phone'],
      address: map['address'],
      verified: map['verified'] ?? false,
      suspended: map['suspended'] ?? false,
      status: map['status'] ?? 'active',
      walletBalance: (map['walletBalance'] ?? 0).toDouble(),
      totalHires: (map['totalHires'] ?? 0),
      totalInterviews: (map['totalInterviews'] ?? 0),
      documents: Map<String, dynamic>.from(map['documents'] ?? {}),
      createdAt: map['createdAt'] != null
          ? (map['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null
          ? (map['updatedAt'] as Timestamp).toDate()
          : null,
    );
  }

  /// Convert Employer → Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'companyName': companyName,
      'email': email,
      'phone': phone,
      'address': address,
      'verified': verified,
      'suspended': suspended,
      'status': status,
      'walletBalance': walletBalance,
      'totalHires': totalHires,
      'totalInterviews': totalInterviews,
      'documents': documents,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': updatedAt != null ? Timestamp.fromDate(updatedAt!) : null,
    };
  }

  /// Clone with updates
  Employer copyWith({
    String? companyName,
    String? email,
    String? phone,
    String? address,
    bool? verified,
    bool? suspended,
    String? status,
    double? walletBalance,
    int? totalHires,
    int? totalInterviews,
    Map<String, dynamic>? documents,
    DateTime? updatedAt,
  }) {
    return Employer(
      id: id,
      companyName: companyName ?? this.companyName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      verified: verified ?? this.verified,
      suspended: suspended ?? this.suspended,
      status: status ?? this.status,
      walletBalance: walletBalance ?? this.walletBalance,
      totalHires: totalHires ?? this.totalHires,
      totalInterviews: totalInterviews ?? this.totalInterviews,
      documents: documents ?? this.documents,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
}
