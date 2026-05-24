import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:encrypt/encrypt.dart' as encrypt;

class EncryptionService {
  static const _storage = FlutterSecureStorage();
  static const _keyKey = 'encryption_key';

  static Future<String> _getOrCreateKey() async {
    String? key = await _storage.read(key: _keyKey);
    if (key == null) {
      key = encrypt.Key.fromSecureRandom(32).base64;
      await _storage.write(key: _keyKey, value: key);
    }
    return key;
  }

  static Future<String> encryptData(String data) async {
    final keyString = await _getOrCreateKey();
    final key = encrypt.Key.fromBase64(keyString);
    final iv = encrypt.IV.fromSecureRandom(16);

    final encrypter = encrypt.Encrypter(encrypt.AES(key));
    final encrypted = encrypter.encrypt(data, iv: iv);

    // Store IV with encrypted data
    return '${iv.base64}:${encrypted.base64}';
  }

  static Future<String> decryptData(String encryptedData) async {
    final keyString = await _getOrCreateKey();
    final key = encrypt.Key.fromBase64(keyString);

    final parts = encryptedData.split(':');
    if (parts.length != 2) throw Exception('Invalid encrypted data format');

    final iv = encrypt.IV.fromBase64(parts[0]);
    final encrypted = encrypt.Encrypted.fromBase64(parts[1]);

    final encrypter = encrypt.Encrypter(encrypt.AES(key));
    return encrypter.decrypt(encrypted, iv: iv);
  }

  static Future<void> storeSecureData(String key, String value) async {
    final encrypted = await encryptData(value);
    await _storage.write(key: key, value: encrypted);
  }

  static Future<String?> retrieveSecureData(String key) async {
    final encrypted = await _storage.read(key: key);
    if (encrypted == null) return null;
    return decryptData(encrypted);
  }

  static Future<void> deleteSecureData(String key) async {
    await _storage.delete(key: key);
  }
}