import 'package:cloud_firestore/cloud_firestore.dart';
import 'financial_reconciliation_service.dart';

class PaymentWebhookService {
  static final PaymentWebhookService _instance =
      PaymentWebhookService._internal();
  final _firestore = FirebaseFirestore.instance;

  factory PaymentWebhookService() {
    return _instance;
  }

  PaymentWebhookService._internal();

  /// Handle Stripe payment success webhook
  /// Called when customer completes Stripe payment
  /// @param paymentIntentId - Stripe payment intent ID
  /// @param metadataId - ID from payment_metadata collection
  /// @param amount - Amount paid in cents (e.g., 5100 = $51.00)
  Future<bool> handleStripePaymentSuccess({
    required String paymentIntentId,
    required String metadataId,
    required int amount,
  }) async {
    try {
      debugPrint(
          '💳 [Stripe Webhook] Processing payment: $paymentIntentId for metadata: $metadataId');

      // Mark payment as paid in financial reconciliation service
      await FinancialReconciliationService.markPaymentPaid(
        metadataId: metadataId,
        transactionId: paymentIntentId,
      );

      // Log webhook event for audit trail
      await _firestore.collection('webhook_events').add({
        'type': 'stripe_payment_success',
        'paymentIntentId': paymentIntentId,
        'metadataId': metadataId,
        'amount': amount,
        'processedAt': DateTime.now().toIso8601String(),
        'status': 'completed',
      });

      debugPrint('✅ [Stripe] Payment marked as paid: $paymentIntentId');
      return true;
    } catch (e) {
      debugPrint('❌ [Stripe] Error processing payment: $e');

      // Log failed webhook event
      await _firestore.collection('webhook_events').add({
        'type': 'stripe_payment_failed',
        'paymentIntentId': paymentIntentId,
        'metadataId': metadataId,
        'error': '$e',
        'processedAt': DateTime.now().toIso8601String(),
        'status': 'failed',
      });

      return false;
    }
  }

  /// Handle Stripe payment failure webhook
  Future<bool> handleStripePaymentFailed({
    required String paymentIntentId,
    required String metadataId,
    required String failureReason,
  }) async {
    try {
      debugPrint(
          '❌ [Stripe Webhook] Payment failed: $paymentIntentId - $failureReason');

      // Update payment metadata status to failed
      await _firestore
          .collection('payment_metadata')
          .doc(metadataId)
          .update({
        'status': 'failed',
        'failureReason': failureReason,
        'failedAt': DateTime.now().toIso8601String(),
      });

      // Log webhook event
      await _firestore.collection('webhook_events').add({
        'type': 'stripe_payment_failed',
        'paymentIntentId': paymentIntentId,
        'metadataId': metadataId,
        'failureReason': failureReason,
        'processedAt': DateTime.now().toIso8601String(),
        'status': 'logged',
      });

      return true;
    } catch (e) {
      debugPrint('❌ Error logging Stripe payment failure: $e');
      return false;
    }
  }

  /// Handle Flutterwave payment success webhook
  /// Called when customer completes Flutterwave payment
  /// @param transactionId - Flutterwave transaction ID
  /// @param metadataId - ID from payment_metadata collection
  /// @param amount - Amount paid
  Future<bool> handleFlutterwavePaymentSuccess({
    required String transactionId,
    required String metadataId,
    required double amount,
  }) async {
    try {
      debugPrint(
          '💳 [Flutterwave Webhook] Processing payment: $transactionId for metadata: $metadataId');

      // Mark payment as paid in financial reconciliation service
      await FinancialReconciliationService.markPaymentPaid(
        metadataId: metadataId,
        transactionId: transactionId,
      );

      // Log webhook event for audit trail
      await _firestore.collection('webhook_events').add({
        'type': 'flutterwave_payment_success',
        'transactionId': transactionId,
        'metadataId': metadataId,
        'amount': amount,
        'processedAt': DateTime.now().toIso8601String(),
        'status': 'completed',
      });

      debugPrint('✅ [Flutterwave] Payment marked as paid: $transactionId');
      return true;
    } catch (e) {
      debugPrint('❌ [Flutterwave] Error processing payment: $e');

      // Log failed webhook event
      await _firestore.collection('webhook_events').add({
        'type': 'flutterwave_payment_failed',
        'transactionId': transactionId,
        'metadataId': metadataId,
        'error': '$e',
        'processedAt': DateTime.now().toIso8601String(),
        'status': 'failed',
      });

      return false;
    }
  }

  /// Handle Flutterwave payment failure webhook
  Future<bool> handleFlutterwavePaymentFailed({
    required String transactionId,
    required String metadataId,
    required String failureReason,
  }) async {
    try {
      debugPrint(
          '❌ [Flutterwave Webhook] Payment failed: $transactionId - $failureReason');

      // Update payment metadata status to failed
      await _firestore
          .collection('payment_metadata')
          .doc(metadataId)
          .update({
        'status': 'failed',
        'failureReason': failureReason,
        'failedAt': DateTime.now().toIso8601String(),
      });

      // Log webhook event
      await _firestore.collection('webhook_events').add({
        'type': 'flutterwave_payment_failed',
        'transactionId': transactionId,
        'metadataId': metadataId,
        'failureReason': failureReason,
        'processedAt': DateTime.now().toIso8601String(),
        'status': 'logged',
      });

      return true;
    } catch (e) {
      debugPrint('❌ Error logging Flutterwave payment failure: $e');
      return false;
    }
  }

  /// Get all webhook events (admin only)
  Future<List<Map<String, dynamic>>> getWebhookEvents({
    String? type,
    DateTime? startDate,
    DateTime? endDate,
    int limit = 100,
  }) async {
    try {
      Query query = _firestore.collection('webhook_events');

      if (type != null) {
        query = query.where('type', isEqualTo: type);
      }

      if (startDate != null) {
        query = query.where('processedAt',
            isGreaterThanOrEqualTo: startDate.toIso8601String());
      }

      if (endDate != null) {
        query = query.where('processedAt',
            isLessThanOrEqualTo: endDate.toIso8601String());
      }

      query = query.orderBy('processedAt', descending: true).limit(limit);

      final snapshot = await query.get();
      return snapshot.docs
          .map((doc) => doc.data() as Map<String, dynamic>)
          .toList();
    } catch (e) {
      debugPrint('❌ Error getting webhook events: $e');
      return [];
    }
  }

  /// Verify webhook signature (security - implement based on payment processor)
  /// This should be called BEFORE processing any webhook
  /// For Stripe: verify with stripe-signature header and webhook secret
  /// For Flutterwave: verify with X-Flutterwave-Signature header
  Future<bool> verifyWebhookSignature({
    required String payload,
    required String signature,
    required String secret,
    required String provider, // 'stripe' or 'flutterwave'
  }) async {
    try {
      // TODO: Implement proper signature verification
      // This is a placeholder - implement full verification based on provider
      debugPrint('🔐 Verifying $provider webhook signature...');

      // For Stripe:
      // final signature = request.headers['stripe-signature'];
      // verify using Stripe SDK

      // For Flutterwave:
      // final signature = request.headers['X-Flutterwave-Signature'];
      // verify using HMAC SHA256

      return true; // Assume valid for now
    } catch (e) {
      debugPrint('❌ Webhook signature verification failed: $e');
      return false;
    }
  }
}

void debugPrint(String message) {
  print('[PaymentWebhookService] $message');
}
