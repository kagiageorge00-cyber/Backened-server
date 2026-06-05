import 'package:bliss_mobile/firebase_stub.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

class AppInitializerService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Initialize all test data and default accounts required for the app
  static Future<void> initializeApp() async {
    try {
      await _initializeBossAccount();
      await _initializeTestCandidateAccount();
      print('✅ App initialization completed successfully');
    } catch (e) {
      print('❌ App initialization error: $e');
    }
  }

  /// Initialize the boss account used for testing all portals
  static Future<void> _initializeBossAccount() async {
    try {
      const username = 'boss';
      const password = 'boss123';
      final hashedPassword = sha256.convert(utf8.encode(password)).toString();

      // Check if boss account already exists
      final doc = await _firestore.collection('staff').doc(username).get();
      if (doc.exists) {
        print('✅ Boss account already exists');
        return;
      }

      // Create boss account
      await _firestore.collection('staff').doc(username).set({
        'username': username,
        'password': hashedPassword,
        'role': 'boss',
        'email': 'boss@blissconnect.com',
        'displayName': 'Boss Admin',
        'createdAt': FieldValue.serverTimestamp(),
        'isAdmin': true,
        'isActive': true,
      });

      print('✅ Boss account initialized successfully (boss/boss123)');
    } catch (e) {
      print('⚠️  Error initializing boss account: $e');
    }
  }

  /// Initialize a test candidate account
  static Future<void> _initializeTestCandidateAccount() async {
    try {
      const candidateId = 'boss';
      const password = 'boss123';

      // Check if candidate account already exists
      final doc = await _firestore
          .collection('candidate_portal_users')
          .doc(candidateId)
          .get();
      if (doc.exists) {
        print('✅ Test candidate account already exists');
        return;
      }

      // Create candidate account
      await _firestore
          .collection('candidate_portal_users')
          .doc(candidateId)
          .set({
        'id': candidateId,
        'password': password,
        'name': 'Boss Candidate',
        'email': 'boss.candidate@blissconnect.com',
        'phone': '+1234567890',
        'nextOfKin': 'Boss Family',
        'createdAt': FieldValue.serverTimestamp(),
        'isActive': true,
      });

      print('✅ Test candidate account initialized successfully');
    } catch (e) {
      print('⚠️  Error initializing test candidate account: $e');
    }
  }

  /// Initialize employer test account
  static Future<void> initializeEmployerTestAccount() async {
    try {
      const employerId = 'boss_employer';

      final doc =
          await _firestore.collection('employers').doc(employerId).get();
      if (doc.exists) {
        print('✅ Employer test account already exists');
        return;
      }

      await _firestore.collection('employers').doc(employerId).set({
        'id': employerId,
        'name': 'Boss Admin',
        'companyName': 'Bliss Recruitment',
        'email': 'boss@blissconnect.com',
        'phone': '+1234567890',
        'industry': 'Recruitment & Travel',
        'createdAt': FieldValue.serverTimestamp(),
        'isActive': true,
        'isVerified': true,
      });

      print('✅ Employer test account initialized successfully');
    } catch (e) {
      print('⚠️  Error initializing employer account: $e');
    }
  }

  /// Initialize agent test account
  static Future<void> initializeAgentTestAccount() async {
    try {
      const agentEmail = 'boss@blissconnect.com';

      final query = await _firestore
          .collection('agents')
          .where('email', isEqualTo: agentEmail)
          .limit(1)
          .get();

      if (query.docs.isNotEmpty) {
        print('✅ Agent test account already exists');
        return;
      }

      await _firestore.collection('agents').add({
        'agentId': 'boss_agent',
        'name': 'Boss Agent',
        'email': agentEmail,
        'phone': '+1234567890',
        'commission': 0.15,
        'createdAt': FieldValue.serverTimestamp(),
        'isActive': true,
        'isVerified': true,
      });

      print('✅ Agent test account initialized successfully');
    } catch (e) {
      print('⚠️  Error initializing agent account: $e');
    }
  }
}
