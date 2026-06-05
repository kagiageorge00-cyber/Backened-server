import 'package:flutter/material.dart';
import 'package:bliss_mobile/firebase_stub.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  debugPrint("Firebase initialized");
}
