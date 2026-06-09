import 'package:bliss_mobile/firebase_stub.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';

class BossAccountService {
  // Hardcoded credentials for offline support
  static const String _bossUsername = 'boss';
  static const String _bossPassword = 'boss123';
  static final String _bossHashedPassword =
      sha256.convert(utf8.encode(_bossPassword)).toString();

  static Future<void> initializeBossAccount() async {
    try {
      await FirebaseFirestore.instance.collection('staff').doc('boss').set({
        'username': _bossUsername,
        'password': _bossHashedPassword,
        'role': 'boss',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      // Fail silently - credentials will still work offline
      debugPrint('Boss account initialization error: $e');
    }
  }

  static Future<bool> authenticateBoss(String username, String password) async {
    final hashedPassword = sha256.convert(utf8.encode(password)).toString();

    // Check boss credentials first (works offline)
    if (username == _bossUsername && hashedPassword == _bossHashedPassword) {
      return true;
    }

    // Try to check against Firestore
    try {
      final doc = await FirebaseFirestore.instance
          .collection('staff')
          .doc(username)
          .get();
      if (doc.exists) {
        return doc.data()['password'] == hashedPassword;
      }
    } catch (e) {
      // Firestore unavailable - continue without it
      debugPrint('Firestore error during authentication: $e');
    }

    return false;
  }
}
