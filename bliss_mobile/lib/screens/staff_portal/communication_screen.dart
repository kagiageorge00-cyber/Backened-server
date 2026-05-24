import 'package:flutter/material.dart';
import '../bliss_communication/screens/bliss_communication_screen.dart';

class CommunicationScreen extends StatelessWidget {
  final String uid;
  final String name;
  final String role;
  final String profilePictureUrl;

  const CommunicationScreen({
    super.key,
    required this.uid,
    required this.name,
    required this.role,
    this.profilePictureUrl = '',
  });

  @override
  Widget build(BuildContext context) {
    return BlissCommunicationScreen(
      uid: uid,
      name: name,
      role: role,
      profilePictureUrl: profilePictureUrl,
    );
  }
}
