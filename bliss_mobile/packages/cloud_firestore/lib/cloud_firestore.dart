library cloud_firestore;

class FirebaseFirestore {
  static FirebaseFirestore instance = FirebaseFirestore();
  CollectionReference collection(String path) => CollectionReference();
}

class CollectionReference {
  Query where(String field, {required dynamic isEqualTo}) => Query();
  Stream<QuerySnapshot> snapshots() async* {}
  Future<DocumentReference> add(Map<String, dynamic> data) async => DocumentReference();
}

class Query {
  Query orderBy(String field, {bool descending = false}) => this;
  Query limit(int n) => this;
  Stream<QuerySnapshot> snapshots() async* {}
}

class DocumentReference {
  Future<void> set(Map<String, dynamic> data) async {}
  Future<void> update(Map<String, dynamic> data) async {}
  Future<DocumentSnapshot> get() async => DocumentSnapshot();
}

class DocumentSnapshot {
  Map<String, dynamic>? data() => {};
  bool get exists => true;
  String get id => '';
}

class QuerySnapshot<T = dynamic> {
  List<QueryDocumentSnapshot> get docs => [];
}

class QueryDocumentSnapshot<T = dynamic> extends DocumentSnapshot {}
