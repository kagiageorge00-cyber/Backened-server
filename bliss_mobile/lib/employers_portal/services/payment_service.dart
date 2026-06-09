import 'package:bliss_mobile/firebase_stub.dart';

class PaymentService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<String> createHirePayment({
    required String employerId,
    required String candidateId,
    required double amount,
  }) async {
    final docRef = _db.collection('payments').doc();
    await docRef.set({
      'id': docRef.id,
      'employerId': employerId,
      'candidateId': candidateId,
      'amount': amount,
      'status': 'pending',
      'createdAt': DateTime.now().toIso8601String(),
    });
    return docRef.id;
  }

  // Mark payment as verified and unlock candidate
  Future<void> verifyPaymentAndUnlockCandidate(String paymentId) async {
    final paymentSnap = await _db.collection('payments').doc(paymentId).get();
    final data = paymentSnap.data();
    final candidateId = data['candidateId'];
    final employerId = data['employerId'];

    // Update payment
    await _db
        .collection('payments')
        .doc(paymentId)
        .update({'status': 'verified'});

    // Unlock candidate documents
    await _db.collection('candidates').doc(candidateId).update({
      'hirePaid': true,
      'employerId': employerId,
    });
    }
}
