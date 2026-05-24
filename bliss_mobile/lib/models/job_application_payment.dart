class JobApplicationPayment {
  final String id;
  final String candidateId;
  final String jobId;
  final String fullName;
  final String phoneNumber;
  final String
      paymentMethod; // 'mpesa', 'stripe', 'western_union', 'wire_transfer', 'moneygram'
  final String transactionCode;
  final double amount;
  final String currency; // 'KES', 'USD', etc.
  final String status; // 'pending', 'verified', 'failed'
  final String mpesaNumber;
  final String? stripePaymentIntentId;
  final String? westernUnionRef;
  final String? wireTransferRef;
  final String? moneyGramRef;
  final DateTime createdAt;
  final DateTime? verifiedAt;
  final Map<String, dynamic>? metadata;

  JobApplicationPayment({
    required this.id,
    required this.candidateId,
    required this.jobId,
    required this.fullName,
    required this.phoneNumber,
    required this.paymentMethod,
    required this.transactionCode,
    required this.amount,
    required this.currency,
    required this.status,
    required this.mpesaNumber,
    this.stripePaymentIntentId,
    this.westernUnionRef,
    this.wireTransferRef,
    this.moneyGramRef,
    required this.createdAt,
    this.verifiedAt,
    this.metadata,
  });

  factory JobApplicationPayment.fromMap(
    Map<String, dynamic> data,
    String id,
  ) {
    return JobApplicationPayment(
      id: id,
      candidateId: data['candidateId'] ?? '',
      jobId: data['jobId'] ?? '',
      fullName: data['fullName'] ?? '',
      phoneNumber: data['phoneNumber'] ?? '',
      paymentMethod: data['paymentMethod'] ?? 'mpesa',
      transactionCode: data['transactionCode'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      currency: data['currency'] ?? 'KES',
      status: data['status'] ?? 'pending',
      mpesaNumber: data['mpesaNumber'] ?? '+254798242350',
      stripePaymentIntentId: data['stripePaymentIntentId'],
      westernUnionRef: data['westernUnionRef'],
      wireTransferRef: data['wireTransferRef'],
      moneyGramRef: data['moneyGramRef'],
      createdAt: data['createdAt'] != null
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
      verifiedAt: data['verifiedAt'] != null
          ? DateTime.parse(data['verifiedAt'])
          : null,
      metadata: data['metadata'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'candidateId': candidateId,
      'jobId': jobId,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'paymentMethod': paymentMethod,
      'transactionCode': transactionCode,
      'amount': amount,
      'currency': currency,
      'status': status,
      'mpesaNumber': mpesaNumber,
      'stripePaymentIntentId': stripePaymentIntentId,
      'westernUnionRef': westernUnionRef,
      'wireTransferRef': wireTransferRef,
      'moneyGramRef': moneyGramRef,
      'createdAt': createdAt.toIso8601String(),
      'verifiedAt': verifiedAt?.toIso8601String(),
      'metadata': metadata,
    };
  }

  JobApplicationPayment copyWith({
    String? id,
    String? candidateId,
    String? jobId,
    String? fullName,
    String? phoneNumber,
    String? paymentMethod,
    String? transactionCode,
    double? amount,
    String? currency,
    String? status,
    String? mpesaNumber,
    String? stripePaymentIntentId,
    String? westernUnionRef,
    String? wireTransferRef,
    String? moneyGramRef,
    DateTime? createdAt,
    DateTime? verifiedAt,
    Map<String, dynamic>? metadata,
  }) {
    return JobApplicationPayment(
      id: id ?? this.id,
      candidateId: candidateId ?? this.candidateId,
      jobId: jobId ?? this.jobId,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      transactionCode: transactionCode ?? this.transactionCode,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      status: status ?? this.status,
      mpesaNumber: mpesaNumber ?? this.mpesaNumber,
      stripePaymentIntentId:
          stripePaymentIntentId ?? this.stripePaymentIntentId,
      westernUnionRef: westernUnionRef ?? this.westernUnionRef,
      wireTransferRef: wireTransferRef ?? this.wireTransferRef,
      moneyGramRef: moneyGramRef ?? this.moneyGramRef,
      createdAt: createdAt ?? this.createdAt,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      metadata: metadata ?? this.metadata,
    );
  }
}
