class MarketplaceModel {
  final String id;
  final String candidateId;
  final String employerId;
  final double hireFee;
  final bool hirePaid;
  final bool documentsUnlocked;
  final String status;
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

  /// ✅ FROM BACKEND (JSON)
  factory MarketplaceModel.fromMap(Map<String, dynamic> data, String id) {
    return MarketplaceModel(
      id: id,
      candidateId: data['candidateId'] ?? '',
      employerId: data['employerId'] ?? '',
      hireFee: (data['hireFee'] ?? 0).toDouble(),
      hirePaid: data['hirePaid'] ?? false,
      documentsUnlocked: data['documentsUnlocked'] ?? false,
      status: data['status'] ?? 'available',
      deploymentDate: data['deploymentDate'] != null
          ? DateTime.tryParse(data['deploymentDate'])
          : null,
      postedAt: data['postedAt'] != null
          ? DateTime.tryParse(data['postedAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  /// ✅ TO BACKEND (JSON)
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

  /// ✅ COPY WITH
  MarketplaceModel copyWith({
    String? candidateId,
    String? employerId,
    double? hireFee,
    bool? hirePaid,
    bool? documentsUnlocked,
    String? status,
    DateTime? deploymentDate,
    DateTime? postedAt,
  }) {
    return MarketplaceModel(
      id: id,
      candidateId: candidateId ?? this.candidateId,
      employerId: employerId ?? this.employerId,
      hireFee: hireFee ?? this.hireFee,
      hirePaid: hirePaid ?? this.hirePaid,
      documentsUnlocked: documentsUnlocked ?? this.documentsUnlocked,
      status: status ?? this.status,
      deploymentDate: deploymentDate ?? this.deploymentDate,
      postedAt: postedAt ?? this.postedAt,
    );
  }
}
