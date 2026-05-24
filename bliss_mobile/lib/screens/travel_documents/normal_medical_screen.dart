import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../../widgets/payment_helper.dart';
import '../widgets/file_upload_tile.dart';

class NormalMedicalScreen extends StatefulWidget {
  static const routeName = '/normalMedical';

  const NormalMedicalScreen({super.key});

  @override
  State<NormalMedicalScreen> createState() => _NormalMedicalScreenState();
}

class _NormalMedicalScreenState extends State<NormalMedicalScreen> {
  Widget _bookingStatusWidget() {
    if (booking == null) return const SizedBox.shrink();
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Booking Status',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Payment Status: \\${booking?['paymentStatus'] ?? ''}'),
            Text('Booking Status: \\${booking?['bookingStatus'] ?? ''}'),
            if ((booking?['bookingStatus'] ?? '') == 'confirmed') ...[
              const Divider(),
              Text('Date: \\${booking?['date'] ?? ''}'),
              Text('Time: \\${booking?['time'] ?? ''}'),
              Text('Venue: \\${booking?['venue'] ?? ''}'),
            ],
          ],
        ),
      ),
    );
  }

  File? paymentProofFile;
  final TextEditingController transactionCodeController =
      TextEditingController();
  Future<void> _submitPaymentProof() async {
    if (booking == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No booking found. Please book first.")),
      );
      return;
    }
    if (paymentProofFile == null &&
        transactionCodeController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                "Please upload a payment screenshot or enter transaction code.")),
      );
      return;
    }
    setState(() => status = "Uploading payment proof...");
    try {
      final result = await BlissMedicalService.submitPaymentProof(
        bookingId: booking!["_id"] ?? booking!["id"] ?? "",
        transactionCode: transactionCodeController.text.trim().isEmpty
            ? null
            : transactionCodeController.text.trim(),
        proofFile: paymentProofFile,
      );
      setState(() {
        booking = result;
        status = "Payment proof submitted. Awaiting admin verification.";
      });
    } catch (e) {
      setState(() => status = "Payment proof upload failed");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Upload failed: $e")),
      );
    }
  }

  void _onPaymentProofPicked(File? f) {
    setState(() => paymentProofFile = f);
  }

  File? idFile;
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController idNumberController = TextEditingController();
  final TextEditingController genderController = TextEditingController();
  final TextEditingController dobController = TextEditingController();
  String status = 'Draft';
  Map<String, dynamic>? booking;

  String? selectedBranch;
  String? bookingId;
  DateTime? bookedDate;
  TimeOfDay? bookedTime;

  void _onFilePicked(File? f) {
    setState(() => idFile = f);
  }

  Future<void> _payAndBook() async {
    if (idFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please upload your National ID / Passport")),
      );
      return;
    }
    final name = nameController.text.trim();
    final phone = mobileController.text.trim();
    final idNumber = idNumberController.text.trim();
    final gender = genderController.text.trim();
    final dob = dobController.text.trim();
    if (name.isEmpty ||
        phone.isEmpty ||
        idNumber.isEmpty ||
        gender.isEmpty ||
        dob.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill all fields.")),
      );
      return;
    }
    setState(() => status = "Booking...");
    try {
      final result = await BlissMedicalService.bookMedical(
        userId: 'CURRENT_USER_ID', // Replace with actual user id from session
        fullName: name,
        phone: phone,
        idNumber: idNumber,
        gender: gender,
        dateOfBirth: dob,
      );
      setState(() {
        booking = result;
        status = "Booked. Please pay and upload proof.";
      });
    } catch (e) {
      setState(() => status = "Booking failed");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Booking failed: $e")),
      );
    }
  }

  void _generateBookingSlip() {
    final rand = Random();
    bookingId = "MED${rand.nextInt(99999) + 10000}";
    final now = DateTime.now();
    bookedDate = now.add(const Duration(days: 1));
    bookedTime = const TimeOfDay(hour: 10, minute: 0);
  }

  void _showBranchSelectionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Select Medical Branch'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              value: 'Nairobi',
              groupValue: selectedBranch,
              title: const Text('Nairobi'),
              onChanged: (v) => setState(() => selectedBranch = v),
            ),
            RadioListTile<String>(
              value: 'Eldoret',
              groupValue: selectedBranch,
              title: const Text('Eldoret'),
              onChanged: (v) => setState(() => selectedBranch = v),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: selectedBranch == null
                ? null
                : () {
                    Navigator.of(ctx).pop();
                    _showBookingSlip();
                  },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  void _showBookingSlip() {
    final dateStr =
        "${bookedDate!.day}/${bookedDate!.month}/${bookedDate!.year}";
    final timeStr = bookedTime!.format(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Logo(height: 28, width: 28),
            SizedBox(width: 10),
            Expanded(child: Text('Bliss Connect Medical Receipt')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Booking ID: $bookingId'),
            Text('Branch: $selectedBranch'),
            Text('Date: $dateStr'),
            Text('Time: $timeStr'),
            const SizedBox(height: 8),
            const Text(
              'Please bring your ID and this branded booking receipt to the medical branch.',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Widget _statusChip() {
    final color = status.contains("Payment") ? Colors.green : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  @override
  void dispose() {
    mobileController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text('Normal Medical Booking'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _statusChip(),
            _bookingStatusWidget(),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                children: [
                  FileUploadTile(
                    title: 'National ID / Passport',
                    hint: 'Upload your ID or Passport',
                    onFilePicked: _onFilePicked,
                  ),
                  const SizedBox(height: 12),
                  if (booking != null) ...[
                    const Divider(),
                    const Text('Step 2: Submit Payment Proof',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    FileUploadTile(
                      title: 'Payment Screenshot',
                      hint: 'Upload payment screenshot (optional)',
                      onFilePicked: _onPaymentProofPicked,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: transactionCodeController,
                      decoration: const InputDecoration(
                          labelText: 'Transaction Code (optional)'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _submitPaymentProof,
                      child: const Text('Submit Payment Proof'),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Full Name'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: mobileController,
                    keyboardType: TextInputType.phone,
                    decoration:
                        const InputDecoration(labelText: 'Mobile Number'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: idNumberController,
                    decoration: const InputDecoration(labelText: 'ID Number'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: genderController,
                    decoration: const InputDecoration(labelText: 'Gender'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: dobController,
                    decoration: const InputDecoration(
                        labelText: 'Date of Birth (YYYY-MM-DD)'),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _payAndBook,
                    child: const Text('Book Medical (KES 7,500)'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
