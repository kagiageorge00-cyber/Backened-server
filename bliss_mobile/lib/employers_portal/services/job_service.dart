import 'package:bliss_mobile/firebase_stub.dart';
import '../models/job_model.dart';
import '../../services/activity_log_service.dart';
import '../../services/backend_auth.dart';
import '../models/user_role.dart';

class JobService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Create job
  Future<String> createJob(Job job) async {
    final docRef = _db.collection('jobs').doc();
    job.id = docRef.id;
    await docRef.set(job.toMap());

    // Activity log
    await ActivityLogService.log(
      type: 'job_creation',
      actorId: BackendAuth.userId ?? job.employerId,
      actorRole: UserRole.employer.value,
      description: 'Created job: \\${job.title}',
      details: job.toMap(),
    );

    return docRef.id;
  }

  // Update job
  Future<void> updateJob(Job job) async {
    await _db.collection('jobs').doc(job.id).update(job.toMap());
  }

  // Fetch all jobs (for marketplace)
  Stream<List<Job>> fetchJobs() {
    return _db.collection('jobs').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Job.fromMap(doc.data())).toList();
    });
  }

  // Fetch employer's jobs
  Stream<List<Job>> fetchEmployerJobs(String employerId) {
    return _db
        .collection('jobs')
        .where('employerId', isEqualTo: employerId)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Job.fromMap(doc.data())).toList());
  }
}
