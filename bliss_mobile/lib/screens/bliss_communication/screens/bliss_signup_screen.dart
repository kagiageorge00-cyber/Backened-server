// bliss_signup_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../services/backend_register_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../services/backend_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';

// If you named the loader differently, update this route or the navigation below.
const String kLoaderRoute = '/blissLoader';

class BlissSignupScreen extends StatefulWidget {
  const BlissSignupScreen({super.key});

  @override
  State<BlissSignupScreen> createState() => _BlissSignupScreenState();
}

class _BlissSignupScreenState extends State<BlissSignupScreen> {
  final _formKey = GlobalKey<FormState>();
  String name = '', email = '', password = '', role = 'candidate';
  XFile? profileImage;
  bool _isLoading = false;

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  Future<void> pickImage() async {
    final picker = ImagePicker();
    final image =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (image != null) setState(() => profileImage = image);
  }

  Future<String> _uploadProfilePicture(String uid) async {
    if (profileImage == null) return '';
    final file = File(profileImage!.path);
    final ref = _storage.ref().child(
        'profile_pictures/$uid/profile_${DateTime.now().millisecondsSinceEpoch}.jpg');
    final uploadTask = await ref.putFile(file);
    final url = await uploadTask.ref.getDownloadURL();
    return url;
  }

  Future<void> _createUserDocument({
    required String uid,
    required String name,
    required String email,
    required String role,
    required String profilePictureUrl,
  }) async {
    await _firestore.collection('users').doc(uid).set({
      'uid': uid,
      'accountTypeId': uid,
      'name': name,
      'email': email,
      'role': role,
      'profilePictureUrl': profilePictureUrl,
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> signup() async {
    if (!_formKey.currentState!.validate()) return;

    _formKey.currentState!.save();
    setState(() => _isLoading = true);

    try {
      // Register via backend
      final registerResp = await BackendRegisterService.register(
          name: name, email: email, extra: {'role': role});
      if (!registerResp.success || registerResp.id == null) {
        final msg = registerResp.error ?? 'Registration failed';
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(msg)));
        return;
      }

      final backendId = registerResp.id!.toString();

      // 2) upload profile picture (if provided)
      String profileUrl = '';
      if (profileImage != null) {
        try {
          profileUrl = await _uploadProfilePicture(backendId);
        } catch (e) {
          debugPrint('Profile upload failed: $e');
        }
      }

      // 3) write normalized user doc to /users/{backendId}
      await _createUserDocument(
        uid: backendId,
        name: name,
        email: email,
        role: role,
        profilePictureUrl: profileUrl,
      );

      // store backend id reference
      await _firestore
          .collection('users')
          .doc(backendId)
          .set({'backendId': backendId}, SetOptions(merge: true));

      // set backend session
      BackendAuth.setSession(id: backendId);

      Navigator.pushReplacementNamed(context, kLoaderRoute);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blueGrey.shade50,
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: ListView(
                children: [
                  const SizedBox(height: 50),
                  Center(
                    child: GestureDetector(
                      onTap: pickImage,
                      child: CircleAvatar(
                        radius: 60,
                        backgroundColor: Colors.grey.shade300,
                        backgroundImage: profileImage != null
                            ? FileImage(File(profileImage!.path))
                            : null,
                        child: profileImage == null
                            ? const Icon(Icons.add_a_photo,
                                size: 50, color: Colors.white)
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 2),
                      ),
                    ),
                    style: const TextStyle(color: Colors.black87, fontSize: 16),
                    validator: (val) => val == null || val.trim().isEmpty
                        ? 'Enter your name'
                        : null,
                    onSaved: (val) => name = val!.trim(),
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Email',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 2),
                      ),
                    ),
                    style: const TextStyle(color: Colors.black87, fontSize: 16),
                    keyboardType: TextInputType.emailAddress,
                    validator: (val) => val == null || val.trim().isEmpty
                        ? 'Enter your email'
                        : null,
                    onSaved: (val) => email = val!.trim(),
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Password',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 2),
                      ),
                    ),
                    style: const TextStyle(color: Colors.black87, fontSize: 16),
                    obscureText: true,
                    validator: (val) => val == null || val.length < 6
                        ? 'Min 6 characters'
                        : null,
                    onSaved: (val) => password = val!.trim(),
                  ),
                  const SizedBox(height: 20),
                  DropdownButtonFormField<String>(
                    initialValue: role,
                    decoration: const InputDecoration(labelText: 'Select Role'),
                    items: const [
                      DropdownMenuItem(
                          value: 'candidate', child: Text('Candidate')),
                      DropdownMenuItem(
                          value: 'employer', child: Text('Employer')),
                    ],
                    onChanged: (val) =>
                        setState(() => role = val ?? 'candidate'),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: _isLoading ? null : signup,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      backgroundColor: Colors.blue.shade700,
                    ),
                    child:
                        const Text('Sign Up', style: TextStyle(fontSize: 18)),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: _isLoading
                        ? null
                        : () => Navigator.pushNamed(context, '/blissLogin'),
                    child: const Text('Already have an account? Login'),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),

          // Loading overlay
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.35),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
