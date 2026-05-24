// lib/employers_portal/services/marketplace_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/job_model.dart';

class MarketplaceService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String collection = 'marketplace';

  /// Add a new job to the marketplace
  Future<void> addJobToMarketplace(Job job) async {
    final docRef = _db.collection(collection).doc(job.id);
    if (job.id.isEmpty) {
      job.id = docRef.id; // Assign Firestore doc ID if empty
    }
    await docRef.set(job.toMap());
  }

  /// Update job details
  Future<void> updateJob({
    required String jobId,
    String? title,
    String? description,
    String? location,
    double? salary,
    String? contractType,
    DateTime? expiryDate,
    int? applicantsCount,
  }) async {
    final Map<String, dynamic> data = {};
    if (title != null) data['title'] = title;
    if (description != null) data['description'] = description;
    if (location != null) data['location'] = location;
    if (salary != null) data['salary'] = salary;
    if (contractType != null) data['contractType'] = contractType;
    if (expiryDate != null) data['expiryDate'] = Timestamp.fromDate(expiryDate);
    if (applicantsCount != null) data['applicantsCount'] = applicantsCount;
    data['lastUpdated'] = FieldValue.serverTimestamp();

    if (data.isNotEmpty) {
      await _db.collection(collection).doc(jobId).update(data);
    }
  }

  /// Remove a job from the marketplace
  Future<void> deleteJob(String jobId) async {
    await _db.collection(collection).doc(jobId).delete();
  }

  /// Stream all marketplace jobs, ordered by posted date
  Stream<List<Job>> getMarketplaceJobs() {
    return _db
        .collection(collection)
        .orderBy('postedAt', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Job.fromDocument(doc)).toList());
  }

  /// Fetch a single job by ID
  Future<Job?> getJobById(String jobId) async {
    final doc = await _db.collection(collection).doc(jobId).get();
    if (!doc.exists) return null;
    return Job.fromDocument(doc);
  }

  /// Stream jobs for a specific employer
  Stream<List<Job>> getJobsByEmployer(String employerId) {
    return _db
        .collection(collection)
        .where('employerId', isEqualTo: employerId)
        .orderBy('postedAt', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Job.fromDocument(doc)).toList());
  }
}
