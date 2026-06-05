library firebase_storage;

class FirebaseStorage {
  static FirebaseStorage instance = FirebaseStorage();
  Reference ref(String path) => Reference();
}

class Reference {
  Future<String> getDownloadURL() async => '';
}
