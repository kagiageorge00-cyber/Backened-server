/// Application Configuration
/// This file should be externalized per environment (dev, staging, prod)
/// In production, use Firebase Remote Config or environment variables
library;

class AppConfig {
  // ==================== ENVIRONMENT ====================
  static const String environment =
      'development'; // 'development' | 'staging' | 'production'

  // ==================== API KEYS (DO NOT COMMIT REAL KEYS) ====================
  // In production, load these from:
  // - Firebase Remote Config
  // - Environment variables
  // - Secure storage
  // - Backend API that validates device

  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: 'pk_test_YOUR_TEST_PUBLISHABLE_KEY', // Placeholder
  );

  static const String stripeSecretKey = String.fromEnvironment(
    'STRIPE_SECRET_KEY',
    defaultValue:
        'sk_test_YOUR_TEST_SECRET_KEY', // Placeholder - NEVER use in app
  );

  static const String flutterwavePublicKey = String.fromEnvironment(
    'FLUTTERWAVE_PUBLIC_KEY',
    defaultValue: 'FLWAVE_PUBKEY_XXXXXXX', // Placeholder
  );

  static const String whatsappApiToken = String.fromEnvironment(
    'WHATSAPP_API_TOKEN',
    defaultValue: 'YOUR_WHATSAPP_API_TOKEN', // Placeholder
  );

  static const String agoraRtcToken = String.fromEnvironment(
    'AGORA_RTC_TOKEN',
    defaultValue: 'YOUR_AGORA_TOKEN', // Placeholder
  );

  static const String firebaseProjectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'bliss-recruitment-prod', // Update per environment
  );

  // ==================== WEBHOOK SECRETS ====================
  static const String stripeWebhookSecret = String.fromEnvironment(
    'STRIPE_WEBHOOK_SECRET',
    defaultValue: 'whsec_test_xxxxxxx',
  );

  static const String flutterwaveWebhookSecret = String.fromEnvironment(
    'FLUTTERWAVE_WEBHOOK_SECRET',
    defaultValue: 'XXXXXXXXXXXXXXXX',
  );

  // ==================== BANK / PAYMENT SETTINGS ====================
  // NOTE: Do not expose the actual private bank account number in the application UI.
  // Use environment variables or backend configuration for production secrets.
  static const String stripeBankName = String.fromEnvironment(
    'STRIPE_BANK_NAME',
    defaultValue: 'Equity Bank',
  );

  static const String stripeBankAccountNumber = String.fromEnvironment(
    'EQUITY_BANK_ACCOUNT_NUMBER',
    defaultValue: 'REPLACE_WITH_SECURE_VALUE',
  );

  // ==================== AMADEUS CREDENTIALS ====================
  // Amadeus credentials should NEVER be in app code
  // Call backend API instead (which has its own credentials)
  static const String amadeusApiBaseUrl = String.fromEnvironment(
    'AMADEUS_API_BASE_URL',
    defaultValue: 'https://backened-server.onrender.com',
  );

  static const String amadeusApiKey = String.fromEnvironment(
    'AMADEUS_API_KEY',
    defaultValue: 'YOUR_API_KEY_HERE', // Set in Cloud Functions environment
  );

  // ==================== URLS ====================
  static const String backendUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'https://backened-server.onrender.com',
  );

  static const String cloudFunctionsUrl = String.fromEnvironment(
    'CLOUD_FUNCTIONS_URL',
    defaultValue: 'https://backened-server.onrender.com',
  );

  // ==================== DEFAULT CREDENTIALS (DEV/STAGING ONLY) ====================
  // These should NEVER appear in production builds
  static const String bossDevUsername = 'boss';
  static const String bossDevPassword = 'boss123'; // STAGING ONLY

  static bool get isDevelopment => environment == 'development';
  static bool get isStaging => environment == 'staging';
  static bool get isProduction => environment == 'production';

  // ==================== API CALL SETTINGS ====================
  static const Duration apiTimeout = Duration(seconds: 30);
  static const int apiRetryCount = 3;
  static const Duration apiRetryDelay = Duration(seconds: 2);

  // ==================== SECURITY SETTINGS ====================
  static bool get skipWebhookVerification =>
      isDevelopment; // ALWAYS false in production
  static const int maxLoginAttempts = 5;
  static const Duration lockoutDuration = Duration(minutes: 30);

  // ==================== LOGGER SETTINGS ====================
  static bool get enableDetailedLogging => isDevelopment;
  static bool get enableCrashReporting => isProduction;
}
