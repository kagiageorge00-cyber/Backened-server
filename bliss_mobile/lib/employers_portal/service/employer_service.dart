// lib/employers_portal/services/employer_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';

class EmployerService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String collection = 'employers';

  Future<void> createEmployer(Map<String, dynamic> employerData, String employerId) async {
    await _db.collection(collection).doc(employerId).set(employerData);
  }

  Future<void> updateEmployer(Map<String, dynamic> employerData, String employerId) async {
    await _db.collection(collection).doc(employerId).update(employerData);
  }

  Future<Map<String, dynamic>?> getEmployer(String employerId) async {
    final doc = await _db.collection(collection).doc(employerId).get();
    return doc.exists ? doc.data() : null;
  }
}
