import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

class CandidateMarketplaceUploader {
  /// Upload candidate info: full photo, ID photo, video, and resume
  static Future<void> uploadCandidate({
    required String candidateId,
    required String resumeText,
    required File fullPhoto,
    required File idPhoto,
    File? videoFile,
  }) async {
    try {
      // 1. Upload full photo
      final fullPhotoRef = FirebaseStorage.instance
          .ref()
          .child('candidate_photos/full/$candidateId.jpg');
      await fullPhotoRef.putFile(fullPhoto);
      final fullPhotoUrl = await fullPhotoRef.getDownloadURL();

      // 2. Upload ID/passport photo
      final idPhotoRef = FirebaseStorage.instance
          .ref()
          .child('candidate_photos/id/$candidateId.jpg');
      await idPhotoRef.putFile(idPhoto);
      final idPhotoUrl = await idPhotoRef.getDownloadURL();

      // 3. Upload video if provided
      String? videoUrl;
      if (videoFile != null) {
        final videoRef = FirebaseStorage.instance
            .ref()
            .child('candidate_videos/$candidateId.mp4');
        await videoRef.putFile(videoFile);
        videoUrl = await videoRef.getDownloadURL();
      }

      // 4. Save all info to Firestore
      await FirebaseFirestore.instance
          .collection('candidates_marketplace')
          .doc(candidateId)
          .set({
        'resume': resumeText,
        'full_photo_url': fullPhotoUrl,
        'id_photo_url': idPhotoUrl,
        'video_url': videoUrl ?? '',
        'created_at': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (e) {
      throw Exception("Upload failed: $e");
    }
  }

  /// Upload only video and return URL (optional helper)
  static Future<String> uploadVideo({
    required String candidateId,
    required File videoFile,
  }) async {
    final storageRef = FirebaseStorage.instance
        .ref()
        .child('candidate_videos/$candidateId.mp4');

    final uploadTask = storageRef.putFile(videoFile);

    final snapshot = await uploadTask.whenComplete(() {});
    final videoUrl = await snapshot.ref.getDownloadURL();

    // Update Firestore with video URL
    await FirebaseFirestore.instance
        .collection('candidates_marketplace')
        .doc(candidateId)
        .set({
      'video_url': videoUrl,
      'updated_at': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    return videoUrl;
  }
}
