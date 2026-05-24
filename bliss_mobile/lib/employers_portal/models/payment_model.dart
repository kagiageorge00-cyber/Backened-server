import 'package:cloud_firestore/cloud_firestore.dart';

class PaymentModel {
  final String id;
  final String candidateId;
  final String candidateName;
  final String employerId;
  final String employerName;
  final String jobId;
  final String jobTitle;

  // Payment details
  final double amount;
  final String paymentMethod; // mpesa, visa, mastercard
  final String status; // pending, verified, failed
  final String transactionId;
  final bool autoVerified;
  final bool manuallyVerified;
  final DateTime createdAt;
  final DateTime? verifiedAt;

  PaymentModel({
    required this.id,
    required this.candidateId,
    required this.candidateName,
    required this.employerId,
    required this.employerName,
    required this.jobId,
    required this.jobTitle,
    required this.amount,
    required this.paymentMethod,
    this.status = 'pending',
    required this.transactionId,
    this.autoVerified = false,
    this.manuallyVerified = false,
    DateTime? createdAt,
    this.verifiedAt,
  }) : createdAt = createdAt ?? DateTime.now();

  // Convert Firestore document to PaymentModel
  factory PaymentModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return PaymentModel(
      id: doc.id,
      candidateId: data['candidateId'] ?? '',
      candidateName: data['candidateName'] ?? '',
      employerId: data['employerId'] ?? '',
      employerName: data['employerName'] ?? '',
      jobId: data['jobId'] ?? '',
      jobTitle: data['jobTitle'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      paymentMethod: data['paymentMethod'] ?? '',
      status: data['status'] ?? 'pending',
      transactionId: data['transactionId'] ?? '',
      autoVerified: data['autoVerified'] ?? false,
      manuallyVerified: data['manuallyVerified'] ?? false,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      verifiedAt: data['verifiedAt'] != null
          ? (data['verifiedAt'] as Timestamp).toDate()
          : null,
    );
  }

  // Convert PaymentModel to Map<String, dynamic> for Firestore
  Map<String, dynamic> toMap() {
    return {
      'candidateId': candidateId,
      'candidateName': candidateName,
      'employerId': employerId,
      'employerName': employerName,
      'jobId': jobId,
      'jobTitle': jobTitle,
      'amount': amount,
      'paymentMethod': paymentMethod,
      'status': status,
      'transactionId': transactionId,
      'autoVerified': autoVerified,
      'manuallyVerified': manuallyVerified,
      'createdAt': Timestamp.fromDate(createdAt),
      'verifiedAt': verifiedAt != null ? Timestamp.fromDate(verifiedAt!) : null,
    };
  }
}
