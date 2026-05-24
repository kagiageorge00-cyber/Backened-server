enum PaymentType {
  agentSubscription, // USD 100 monthly or registration
  candidateRegistration, // USD 10 per candidate
  employerPayment, // Payment from employer for hired candidate
}

enum PaymentStatus {
  pending,
  completed,
  failed,
}

class PaymentModel {
  final String paymentId;
  final String userId; // Could be agentId or employerId depending on payment
  final PaymentType type;
  final double amount;
  final PaymentStatus status;
  final String? reference; // Transaction reference (e.g., Mpesa, PayPal)
  final DateTime createdAt;

  PaymentModel({
    required this.paymentId,
    required this.userId,
    required this.type,
    required this.amount,
    this.status = PaymentStatus.pending,
    this.reference,
    required this.createdAt,
  });

  // ------------------------
  // Factory to create from backend data
  // ------------------------
  factory PaymentModel.fromMap(Map<String, dynamic> data, String id) {
    return PaymentModel(
      paymentId: id,
      userId: data['userId'] ?? '',
      type: _paymentTypeFromString(data['type'] ?? 'agentSubscription'),
      amount:
          (data['amount'] != null) ? (data['amount'] as num).toDouble() : 0.0,
      status: _paymentStatusFromString(data['status'] ?? 'pending'),
      reference: data['reference'],
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : DateTime.now(),
    );
  }

  // ------------------------
  // Convert to backend-compatible Map
  // ------------------------
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'type': _paymentTypeToString(type),
      'amount': amount,
      'status': _paymentStatusToString(status),
      'reference': reference,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ------------------------
  // Update Payment
  // ------------------------
  PaymentModel copyWith({
    PaymentStatus? status,
    String? reference,
    double? amount,
  }) {
    return PaymentModel(
      paymentId: paymentId,
      userId: userId,
      type: type,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      reference: reference ?? this.reference,
      createdAt: createdAt,
    );
  }

  // ------------------------
  // Helper: Enum conversion
  // ------------------------
  static PaymentType _paymentTypeFromString(String type) {
    switch (type) {
      case 'candidateRegistration':
        return PaymentType.candidateRegistration;
      case 'employerPayment':
        return PaymentType.employerPayment;
      case 'agentSubscription':
      default:
        return PaymentType.agentSubscription;
    }
  }

  static String _paymentTypeToString(PaymentType type) {
    switch (type) {
      case PaymentType.candidateRegistration:
        return 'candidateRegistration';
      case PaymentType.employerPayment:
        return 'employerPayment';
      default:
        return 'agentSubscription';
    }
  }

  static PaymentStatus _paymentStatusFromString(String status) {
    switch (status) {
      case 'completed':
        return PaymentStatus.completed;
      case 'failed':
        return PaymentStatus.failed;
      default:
        return PaymentStatus.pending;
    }
  }

  static String _paymentStatusToString(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.completed:
        return 'completed';
      case PaymentStatus.failed:
        return 'failed';
      default:
        return 'pending';
    }
  }
}
