import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../../widgets/payment_helper.dart';

class ApplyPassportScreen extends StatefulWidget {
  static const routeName = '/applyPassport';

  const ApplyPassportScreen({super.key});

  @override
  State<ApplyPassportScreen> createState() => _ApplyPassportScreenState();
}

class _ApplyPassportScreenState extends State<ApplyPassportScreen> {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();

  bool hasEcitizen = false;

  String? fullPhotoFile;
  String? idFile;
  String? birthCertFile;
  String? parentsIdFile;

  String status = 'Draft';
  Color get _brandColor => Colors.deepOrangeAccent;

  Future<void> pickFile(Function(String) onSelected) async {
    // Simulate file pick, replace with real file picker in production
    onSelected("file_selected.jpg");
    setState(() {});
  }

  Future<void> _payAndContinue() async {
    if (fullNameController.text.trim().isEmpty ||
        mobileController.text.trim().length < 9 ||
        fullPhotoFile == null ||
        idFile == null ||
        birthCertFile == null ||
        parentsIdFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill all fields and upload all files")),
      );
      return;
    }

    String phone = mobileController.text.trim();
    if (phone.startsWith("0")) phone = "254${phone.substring(1)}";

    setState(() => status = "Waiting for payment...");

    final ok = await showUnifiedPaymentDialog(
      context,
      payerName: fullNameController.text.trim().isNotEmpty ? fullNameController.text.trim() : 'Applicant',
      payerPhone: mobileController.text.trim(),
      amount: 250.0,
      title: 'Apply Passport Payment',
    );

    if (ok) {
      setState(() => status = "Payment received • Proceed");
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Payment successful! Proceed to next step.")));
      // TODO: Navigate to next step (medical booking, etc.)
    } else {
      setState(() => status = "Payment failed or cancelled");
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Payment not completed.")));
    }
  }

  int _getCompletionPercentage() {
    int count = 0;
    if (fullNameController.text.trim().isNotEmpty) count++;
    if (mobileController.text.trim().isNotEmpty) count++;
    if (fullPhotoFile != null) count++;
    if (idFile != null) count++;
    if (birthCertFile != null) count++;
    if (parentsIdFile != null) count++;
    return ((count / 6) * 100).round();
  }

  Widget _statusChip() {
    final color = status.contains("Payment") ? Colors.green : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  @override
  void dispose() {
    fullNameController.dispose();
    mobileController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final progress = _getCompletionPercentage();
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FB),
      appBar: AppBar(
        backgroundColor: _brandColor,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text('Apply for Passport'),
          ],
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Progress & Status Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Application Progress', style: TextStyle(fontWeight: FontWeight.w600)),
                        _statusChip(),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(value: progress / 100, color: _brandColor, minHeight: 8),
                    ),
                    const SizedBox(height: 6),
                    Text('$progress% Complete', style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Personal Information Section
            const Text('Personal Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            TextField(
              controller: fullNameController,
              onChanged: (v) => setState(() {}),
              decoration: InputDecoration(
                labelText: 'Full Name',
                prefixIcon: const Icon(Icons.person_outline),
                filled: true,
                fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.grey[800] : Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              ),
              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black87, fontSize: 16),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: mobileController,
              keyboardType: TextInputType.phone,
              onChanged: (v) => setState(() {}),
              decoration: InputDecoration(
                labelText: 'Mobile Number (e.g., 0712345678)',
                prefixIcon: const Icon(Icons.phone_outlined),
                filled: true,
                fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.grey[800] : Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              ),
              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black87, fontSize: 16),
            ),
            const SizedBox(height: 18),

            // Document Upload Section
            const Text('Required Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            _documentCard('📷 Full Photo', fullPhotoFile, () => pickFile((file) => setState(() => fullPhotoFile = file))),
            const SizedBox(height: 12),
            _documentCard('🆔 Original ID/Passport', idFile, () => pickFile((file) => setState(() => idFile = file))),
            const SizedBox(height: 12),
            _documentCard('📜 Birth Certificate', birthCertFile, () => pickFile((file) => setState(() => birthCertFile = file))),
            const SizedBox(height: 12),
            _documentCard('👨‍👩‍👧 Parents\' ID Copies', parentsIdFile, () => pickFile((file) => setState(() => parentsIdFile = file))),
            const SizedBox(height: 20),

            // Info Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue.shade700),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Fee: KES 250 (one-time). Payment via M-Pesa.',
                      style: TextStyle(color: Colors.blue.shade700, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              height: 54,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _brandColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _payAndContinue,
                child: const Text('Pay & Submit — KES 250', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _documentCard(String label, String? file, VoidCallback onTap) {
    final isUploaded = file != null;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isUploaded ? Colors.green.shade50 : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isUploaded ? Colors.green.shade300 : Colors.grey.shade300),
          ),
          child: Row(
            children: [
              Icon(isUploaded ? Icons.check_circle : Icons.cloud_upload_outlined, color: isUploaded ? Colors.green : Colors.grey.shade600),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      isUploaded ? 'File uploaded' : 'Tap to upload',
                      style: TextStyle(color: isUploaded ? Colors.green : Colors.grey.shade600, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Icon(isUploaded ? Icons.verified : Icons.arrow_forward_ios, color: isUploaded ? Colors.green : Colors.grey.shade500, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
