import 'api_config.dart';

class AppConfig {
  // =========================
  // 🔥 BACKEND URL
  // =========================
  static const String backendUrl = ApiConfig.baseUrl;

  // =========================
  // ⏱ TIMEOUT (SHORTER = FASTER FAIL)
  // =========================
  static const Duration apiTimeout = Duration(seconds: 20);

  // =========================
  // 🧾 LOGGING
  // =========================
  static const bool enableDetailedLogging = true;
}
