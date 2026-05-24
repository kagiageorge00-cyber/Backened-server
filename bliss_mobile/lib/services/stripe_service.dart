import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';

class StripeService {
  static final String publishableKey = AppConfig.stripePublishableKey;
  static final String secretKey = AppConfig.stripeSecretKey;

  static void init() {
    Stripe.publishableKey = publishableKey;
  }

  static Future<Map<String, dynamic>> createPaymentIntent(
      int amount, String currency) async {
    try {
      final response = await http.post(
        Uri.parse('https://api.stripe.com/v1/payment_intents'),
        headers: {
          'Authorization': 'Bearer $secretKey',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          'amount': amount.toString(),
          'currency': currency,
          'payment_method_types[]': 'card',
          'metadata[bank_name]': AppConfig.stripeBankName,
          'metadata[payment_flow]': 'bliss_mobile_card',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to create payment intent');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  static Future<bool> processPayment({
    required int amount,
    required String currency,
    required String customerEmail,
  }) async {
    try {
      final paymentIntent = await createPaymentIntent(amount, currency);
      final clientSecret = paymentIntent['client_secret'];
      await presentPaymentSheet(clientSecret);
      return true;
    } catch (e) {
      return false;
    }
  }

  static Future<void> presentPaymentSheet(String clientSecret) async {
    try {
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Bliss Software',
        ),
      );
      await Stripe.instance.presentPaymentSheet();
    } catch (e) {
      throw Exception('Payment failed: $e');
    }
  }
}
