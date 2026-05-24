import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../services/backend_auth.dart';
import 'package:flutter/material.dart';
import 'bliss_communication_screen.dart';

class BlissLoaderScreen extends StatelessWidget {
  const BlissLoaderScreen({super.key});

  Future<Map<String, dynamic>> loadUserData() async {
    final uid = BackendAuth.userId;
    if (uid == null) throw 'Not logged in';

    final doc =
        await FirebaseFirestore.instance.collection('users').doc(uid).get();

    return {
      'uid': uid,
      'name': doc['name'],
      'role': doc['role'],
      'profilePictureUrl': doc['profile picture'], // FIXED
    };
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: loadUserData(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final userData = snapshot.data!;
        return BlissCommunicationScreen(
          uid: userData['uid'],
          role: userData['role'],
          name: userData['name'],
          profilePictureUrl: userData['profilePictureUrl'],
        );
      },
    );
  }
}
