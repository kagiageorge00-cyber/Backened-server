// Lightweight stubs to satisfy Firebase imports during web build.
// These provide minimal types and methods used across the app.

class FirebaseFirestore {
  FirebaseFirestore._();
  static final instance = FirebaseFirestore._();
  CollectionReference collection(String path) => CollectionReference();
}

class CollectionReference {
  Future<DocumentReference> add(Map<String, dynamic> data) async =>
      DocumentReference();
  DocumentReference doc([String? id]) => DocumentReference();
  Stream<QuerySnapshot> snapshots() => const Stream.empty();
  Future<QuerySnapshot> get() async => QuerySnapshot();
  CollectionReference where(String field, {required Object? isEqualTo}) => this;
  CollectionReference orderBy(String field, {bool descending = false}) => this;
  CollectionReference limit(int n) => this;
}

class DocumentReference {
  Future<void> set(Map<String, dynamic> data, {bool merge = false}) async {}
  Future<void> update(Map<String, dynamic> data) async {}
  Future<void> delete() async {}
  Future<DocumentSnapshot> get() async => DocumentSnapshot();
  Stream<DocumentSnapshot> snapshots() => const Stream.empty();
}

class DocumentSnapshot {
  Map<String, dynamic> data() => <String, dynamic>{};
  String get id => '';
  bool get exists => true;
}

class QuerySnapshot {
  List<QueryDocumentSnapshot> get docs => <QueryDocumentSnapshot>[];
}

class QueryDocumentSnapshot extends DocumentSnapshot {}

class FieldValue {
  static dynamic serverTimestamp() => DateTime.now().toUtc();
}

class Timestamp {
  final DateTime date;
  Timestamp.fromDate(this.date);
}

class FirebaseStorage {
  FirebaseStorage._();
  static final instance = FirebaseStorage._();
  Reference ref([String? path]) => Reference();
}

class Reference {
  Future<String> getDownloadURL() async => '';
  UploadTask putData(List<int> data) => UploadTask();
}

class UploadTask {
  Stream<TaskSnapshot> get snapshotEvents => const Stream.empty();
  Future<TaskSnapshot> whenComplete() async => TaskSnapshot();
}

class TaskSnapshot {}

class FirebaseAuth {
  FirebaseAuth._();
  static final instance = FirebaseAuth._();
}

Future<void> initializeFirebase() async {}

class FirebaseOptions {
  final String apiKey;
  final String appId;
  final String messagingSenderId;
  final String projectId;
  const FirebaseOptions({
    this.apiKey = '',
    this.appId = '',
    this.messagingSenderId = '',
    this.projectId = '',
  });
}
