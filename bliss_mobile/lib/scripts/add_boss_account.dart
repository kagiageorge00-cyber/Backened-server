// Script to add boss account to Firestore
// This can be run from Firebase console or called from the app

import 'package:cloud_firestore/cloud_firestore.dart';

class BossAccountService {
  static Future<void> addBossAccount() async {
    try {
      await FirebaseFirestore.instance.collection('staff').doc('boss001').set({
        'username': 'boss',
        'password': 'boss123', // Change this to a secure password in production
        'name': 'Boss',
        'role': 'admin',
        'email': 'boss@bliss.com',
        'createdAt': FieldValue.serverTimestamp(),
        'permissions': ['all'], // Full access
      });
      print('Boss account added successfully');
    } catch (e) {
      print('Error adding boss account: $e');
    }
  }

  // Call this from a debug screen or admin panel
  static Future<void> initializeBossAccount() async {
    // Check if boss account already exists
    final doc = await FirebaseFirestore.instance.collection('staff').doc('boss001').get();
    if (!doc.exists) {
      await addBossAccount();
    }
  }
}