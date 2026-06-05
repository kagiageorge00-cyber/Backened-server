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

  // ✅ FROM BACKEND (JSON → Model)
  factory PaymentModel.fromMap(Map<String, dynamic> data, String id) {
    return PaymentModel(
      id: id,
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
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
      verifiedAt: data['verifiedAt'] != null
          ? DateTime.parse(data['verifiedAt'])
          : null,
    );
  }

  // ✅ TO BACKEND (Model → JSON)
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
      'createdAt': createdAt.toIso8601String(),
      'verifiedAt': verifiedAt?.toIso8601String(),
    };
  }
}
