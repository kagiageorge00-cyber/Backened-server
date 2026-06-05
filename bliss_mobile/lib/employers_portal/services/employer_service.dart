import 'package:bliss_mobile/firebase_stub.dart';
import '../models/employer_model.dart';

class EmployerService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Create or update employer profile
  Future<void> saveEmployerProfile(Employer employer) async {
    await _db.collection('employers').doc(employer.id).set(
          employer.toMap(),
          SetOptions(merge: true), // Prevent overwriting missing fields
        );
  }

  /// Update only selected fields (partial update)
  Future<void> updateProfileFields(
    String employerId,
    Map<String, dynamic> data,
  ) async {
    await _db.collection('employers').doc(employerId).update(data);
  }

  /// Get realtime employer profile stream
  Stream<Employer?> getEmployerProfile(String employerId) {
    return _db.collection('employers').doc(employerId).snapshots().map((snap) {
      if (!snap.exists || snap.data() == null) return null;
      return Employer.fromMap(snap.data()!, employerId);
    });
  }

  /// Fetch employer profile once (Future)
  Future<Employer?> fetchEmployerProfile(String employerId) async {
    final doc = await _db.collection('employers').doc(employerId).get();
    if (!doc.exists || doc.data() == null) return null;
    return Employer.fromMap(doc.data()!, employerId);
  }

  /// Initialize a new employer profile when they sign up
  Future<void> createDefaultProfile(String employerId, String email) async {
    final defaultProfile = Employer(
      id: employerId,
      companyName: null,
      email: email,
      phone: null,
      address: null,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await saveEmployerProfile(defaultProfile);
  }
}
