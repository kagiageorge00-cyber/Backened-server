import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentMetadata {
  final String id;
  final String bookingId;
  final String bookingType; // 'flight' or 'hotel'
  final double totalAmount;
  final double basePrice;
  final double platformFee;
  final double insurancePrice;
  final double upsellsPrice;
  final String currency;
  final String status; // pending, paid, refunded, failed
  final DateTime createdAt;
  final DateTime? paidAt;
  final String? transactionId;
  final bool amadeusSettled;
  final DateTime? amadeusSettledAt;

  PaymentMetadata({
    required this.id,
    required this.bookingId,
    required this.bookingType,
    required this.totalAmount,
    required this.basePrice,
    required this.platformFee,
    required this.insurancePrice,
    required this.upsellsPrice,
    required this.currency,
    required this.status,
    required this.createdAt,
    this.paidAt,
    this.transactionId,
    required this.amadeusSettled,
    this.amadeusSettledAt,
  });

  double get yourProfit =>
      platformFee + (insurancePrice * 0.60) + (upsellsPrice * 0.40);

  Map<String, dynamic> toMap() {
    return {
      'bookingId': bookingId,
      'bookingType': bookingType,
      'totalAmount': totalAmount,
      'basePrice': basePrice,
      'platformFee': platformFee,
      'insurancePrice': insurancePrice,
      'upsellsPrice': upsellsPrice,
      'currency': currency,
      'status': status,
      'createdAt': createdAt,
      'paidAt': paidAt,
      'transactionId': transactionId,
      'amadeusSettled': amadeusSettled,
      'amadeusSettledAt': amadeusSettledAt,
      'yourProfit': yourProfit,
    };
  }

  factory PaymentMetadata.fromMap(Map<String, dynamic> map, String id) {
    return PaymentMetadata(
      id: id,
      bookingId: map['bookingId'] ?? '',
      bookingType: map['bookingType'] ?? '',
      totalAmount: (map['totalAmount'] ?? 0).toDouble(),
      basePrice: (map['basePrice'] ?? 0).toDouble(),
      platformFee: (map['platformFee'] ?? 0).toDouble(),
      insurancePrice: (map['insurancePrice'] ?? 0).toDouble(),
      upsellsPrice: (map['upsellsPrice'] ?? 0).toDouble(),
      currency: map['currency'] ?? 'USD',
      status: map['status'] ?? 'pending',
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      paidAt: (map['paidAt'] as Timestamp?)?.toDate(),
      transactionId: map['transactionId'],
      amadeusSettled: map['amadeusSettled'] ?? false,
      amadeusSettledAt: (map['amadeusSettledAt'] as Timestamp?)?.toDate(),
    );
  }
}

class Settlement {
  final String id;
  final List<String> bookingIds;
  final List<String> paymentIds;
  final double totalPlatformFee;
  final double totalInsuranceProfit;
  final double totalUpsellsProfit;
  final double totalYourProfit;
  final double totalAmadeusCost;
  final String currency;
  final String settlementPeriod;
  final String status;
  final DateTime createdAt;
  final DateTime? submittedAt;
  final DateTime? paidAt;
  final String? invoiceId;

  Settlement({
    required this.id,
    required this.bookingIds,
    required this.paymentIds,
    required this.totalPlatformFee,
    required this.totalInsuranceProfit,
    required this.totalUpsellsProfit,
    required this.totalYourProfit,
    required this.totalAmadeusCost,
    required this.currency,
    required this.settlementPeriod,
    required this.status,
    required this.createdAt,
    this.submittedAt,
    this.paidAt,
    this.invoiceId,
  });

  Map<String, dynamic> toMap() {
    return {
      'bookingIds': bookingIds,
      'paymentIds': paymentIds,
      'totalPlatformFee': totalPlatformFee,
      'totalInsuranceProfit': totalInsuranceProfit,
      'totalUpsellsProfit': totalUpsellsProfit,
      'totalYourProfit': totalYourProfit,
      'totalAmadeusCost': totalAmadeusCost,
      'currency': currency,
      'settlementPeriod': settlementPeriod,
      'status': status,
      'createdAt': createdAt,
      'submittedAt': submittedAt,
      'paidAt': paidAt,
      'invoiceId': invoiceId,
    };
  }

  factory Settlement.fromMap(Map<String, dynamic> map, String id) {
    return Settlement(
      id: id,
      bookingIds: List<String>.from(map['bookingIds'] ?? []),
      paymentIds: List<String>.from(map['paymentIds'] ?? []),
      totalPlatformFee: (map['totalPlatformFee'] ?? 0).toDouble(),
      totalInsuranceProfit: (map['totalInsuranceProfit'] ?? 0).toDouble(),
      totalUpsellsProfit: (map['totalUpsellsProfit'] ?? 0).toDouble(),
      totalYourProfit: (map['totalYourProfit'] ?? 0).toDouble(),
      totalAmadeusCost: (map['totalAmadeusCost'] ?? 0).toDouble(),
      currency: map['currency'] ?? 'USD',
      settlementPeriod: map['settlementPeriod'] ?? '',
      status: map['status'] ?? 'pending',
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      submittedAt: (map['submittedAt'] as Timestamp?)?.toDate(),
      paidAt: (map['paidAt'] as Timestamp?)?.toDate(),
      invoiceId: map['invoiceId'],
    );
  }
}

class FinancialSummary {
  final double totalCustomerPayments;
  final double totalYourProfit;
  final double totalAmadeusOwed;
  final double totalUnsettled;
  final int totalBookings;
  final int paidBookings;
  final int settledBookings;
  final String currency;

  FinancialSummary({
    required this.totalCustomerPayments,
    required this.totalYourProfit,
    required this.totalAmadeusOwed,
    required this.totalUnsettled,
    required this.totalBookings,
    required this.paidBookings,
    required this.settledBookings,
    required this.currency,
  });

  double get profitMargin => totalCustomerPayments > 0
      ? (totalYourProfit / totalCustomerPayments * 100)
      : 0;
}

class FinancialReconciliationService {
  static const String paymentMetadataCollection = 'payment_metadata';
  static const String settlementsCollection = 'settlements';
  static const String amadeusPayablesCollection = 'amadeus_payables';

  // ==================== CREATE PAYMENT METADATA ====================
  static Future<PaymentMetadata> recordPaymentMetadata({
    required String bookingId,
    required String bookingType,
    required double totalAmount,
    required double basePrice,
    required double platformFee,
    required double insurancePrice,
    required double upsellsPrice,
    required String currency,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(
            'https://your-backend-url/api/financial/record-payment-metadata'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'bookingId': bookingId,
          'bookingType': bookingType,
          'totalAmount': totalAmount,
          'basePrice': basePrice,
          'platformFee': platformFee,
          'insurancePrice': insurancePrice,
          'upsellsPrice': upsellsPrice,
          'currency': currency,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return PaymentMetadata.fromMap(data, data['id'] ?? '');
      } else {
        throw Exception('Failed to record payment metadata');
      }
    } catch (e) {
      throw Exception('Failed to record payment metadata: $e');
    }
  }

  // ==================== MARK PAYMENT AS PAID ====================
  static Future<void> markPaymentPaid({
    required String metadataId,
    required String transactionId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/financial/mark-payment-paid'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'metadataId': metadataId,
          'transactionId': transactionId,
        }),
      );
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Failed to mark payment as paid');
      }
    } catch (e) {
      throw Exception('Failed to mark payment as paid: $e');
    }
  }

  // ==================== CREATE AMADEUS PAYABLE ====================
  static Future<void> _createAmadeusPayable(String metadataId) async {
    // This is now handled by the backend. No-op in client.
    return;
  }

  // ==================== CREATE WEEKLY SETTLEMENT ====================
  static Future<Settlement> createWeeklySettlement() async {
    try {
      final response = await http.post(
        Uri.parse(
            'https://your-backend-url/api/financial/create-weekly-settlement'),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Settlement.fromMap(data, data['id'] ?? '');
      } else {
        throw Exception('Failed to create settlement');
      }
    } catch (e) {
      throw Exception('Failed to create settlement: $e');
    }
  }

  // ==================== SUBMIT SETTLEMENT ====================
  static Future<void> submitSettlement({
    required String settlementId,
    required String invoiceId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/financial/submit-settlement'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'settlementId': settlementId,
          'invoiceId': invoiceId,
        }),
      );
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Failed to submit settlement');
      }
    } catch (e) {
      throw Exception('Failed to submit settlement: $e');
    }
  }

  // ==================== MARK SETTLEMENT PAID ====================
  static Future<void> markSettlementPaid({
    required String settlementId,
    required DateTime paidDate,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(
            'https://your-backend-url/api/financial/mark-settlement-paid'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'settlementId': settlementId,
          'paidAt': paidDate.toIso8601String(),
        }),
      );
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Failed to mark settlement as paid');
      }
    } catch (e) {
      throw Exception('Failed to mark settlement as paid: $e');
    }
  }

  // ==================== GET FINANCIAL SUMMARY ====================
  static Future<FinancialSummary> getFinancialSummary() async {
    try {
      final response = await http.get(
        Uri.parse('https://your-backend-url/api/financial/summary'),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return FinancialSummary(
          totalCustomerPayments:
              (data['totalCustomerPayments'] ?? 0).toDouble(),
          totalYourProfit: (data['totalYourProfit'] ?? 0).toDouble(),
          totalAmadeusOwed: (data['totalAmadeusOwed'] ?? 0).toDouble(),
          totalUnsettled: (data['totalUnsettled'] ?? 0).toDouble(),
          totalBookings: data['totalBookings'] ?? 0,
          paidBookings: data['paidBookings'] ?? 0,
          settledBookings: data['settledBookings'] ?? 0,
          currency: data['currency'] ?? 'USD',
        );
      } else {
        throw Exception('Failed to get financial summary');
      }
    } catch (e) {
      throw Exception('Failed to get financial summary: $e');
    }
  }

  // ==================== GET PENDING SETTLEMENTS ====================
  static Future<List<Settlement>> getPendingSettlements() async {
    try {
      final response = await http.get(
        Uri.parse('https://your-backend-url/api/financial/pending-settlements'),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['settlements'] as List)
            .map((s) => Settlement.fromMap(s, s['id'] ?? ''))
            .toList();
      } else {
        throw Exception('Failed to get pending settlements');
      }
    } catch (e) {
      throw Exception('Failed to get pending settlements: $e');
    }
  }

  // ==================== GENERATE SETTLEMENT REPORT ====================
  static Map<String, dynamic> generateSettlementReport(Settlement settlement) {
    final totalCustomerPayments =
        settlement.totalAmadeusCost + settlement.totalYourProfit;

    return {
      'invoiceId': 'INV-${settlement.id.substring(0, 8).toUpperCase()}',
      'invoiceDate': DateTime.now().toString(),
      'settlementPeriod': settlement.settlementPeriod,
      'totalBookings': settlement.bookingIds.length,
      'breakdown': {
        'customerPaymentsReceived': totalCustomerPayments,
        'platformCommissionFees': settlement.totalPlatformFee,
        'insuranceProfits': settlement.totalInsuranceProfit,
        'upsellsProfits': settlement.totalUpsellsProfit,
        'totalYourEarnings': settlement.totalYourProfit,
      },
      'amadeusPaymentDue': {
        'amount': settlement.totalAmadeusCost,
        'currency': settlement.currency,
        'reason': '${settlement.bookingIds.length} flight/hotel bookings',
      },
      'profitAnalysis': {
        'yourProfit': settlement.totalYourProfit,
        'profitMargin':
            ((settlement.totalYourProfit / totalCustomerPayments) * 100)
                .toStringAsFixed(1),
        'currency': settlement.currency,
      },
    };
  }
}
