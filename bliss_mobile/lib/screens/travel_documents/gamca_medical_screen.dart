import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../../widgets/payment_helper.dart';

class GamcaMedicalScreen extends StatefulWidget {
  static const routeName = '/gamcaMedical';

  const GamcaMedicalScreen({super.key});

  @override
  State<GamcaMedicalScreen> createState() => _GamcaMedicalScreenState();
}

class _GamcaMedicalScreenState extends State<GamcaMedicalScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController firstNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController dobController = TextEditingController();
  final TextEditingController passportNoController = TextEditingController();
  final TextEditingController nationalityController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();

  String? passportPhotoFile;
  String? idCopyFile;

  String status = 'Draft';
  String? bookingId;
  Color get _brandColor => Colors.deepOrangeAccent;

  Future<void> pickFile(Function(String) onSelected) async {
    // Placeholder: replace with actual file picker integration
    onSelected("file_selected.jpg");
    setState(() {});
  }

  Future<void> _payAndBook() async {
    if (!_formKey.currentState!.validate() ||
        passportPhotoFile == null ||
        idCopyFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text("Please fill all fields and upload all documents")));
      return;
    }

    String phone = mobileController.text.trim();
    if (phone.startsWith('0')) phone = '254${phone.substring(1)}';

    setState(() => status = 'Triggering payment...');

    try {
      // Example conversion; integrate real FX rates in production
      final amountKes = 25 * 150; // USD 25 -> KES 150 rate

      final ok = await showUnifiedPaymentDialog(
        context,
        payerName: '${firstNameController.text} ${lastNameController.text}',
        payerPhone: mobileController.text.trim(),
        amount: amountKes.toDouble(),
        title: 'GAMCA Medical Payment',
      );

      if (ok) {
        setState(() {
          status = 'Payment received • Booking confirmed';
          bookingId = 'GAM${DateTime.now().millisecondsSinceEpoch}';
        });

        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Payment successful! Booking confirmed.')));
        _showBookingSlip();
      } else {
        setState(() => status = 'Payment failed or cancelled');
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment not completed.')));
      }
    } catch (e) {
      setState(() => status = 'Payment failed');
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Payment failed: $e')));
    }
  }

  void _showBookingSlip() {
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
            Text(
                'Name: ${firstNameController.text} ${lastNameController.text}'),
            Text('Passport No: ${passportNoController.text}'),
            Text('Nationality: ${nationalityController.text}'),
            const SizedBox(height: 8),
            const Text(
                'Payment confirmed. Please bring this branded receipt, your passport, and a recent photo to the GAMCA Medical Center.'),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('OK')),
        ],
      ),
    );
  }

  Widget _statusChip() {
    final color = status.contains('Payment') ? Colors.green : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    dobController.dispose();
    passportNoController.dispose();
    nationalityController.dispose();
    mobileController.dispose();
    super.dispose();
  }

  int _completionPercent() {
    int filled = 0;
    if (firstNameController.text.trim().isNotEmpty) filled++;
    if (lastNameController.text.trim().isNotEmpty) filled++;
    if (passportNoController.text.trim().isNotEmpty) filled++;
    if (passportPhotoFile != null) filled++;
    if (idCopyFile != null) filled++;
    if (mobileController.text.trim().isNotEmpty) filled++;
    return ((filled / 6) * 100).round();
  }

  @override
  Widget build(BuildContext context) {
    final percent = _completionPercent();
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FB),
      appBar: AppBar(
        backgroundColor: _brandColor,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 56, width: 56),
            SizedBox(width: 8),
            Text('GAMCA Medical Booking'),
          ],
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header card
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8)),
                      child: Icon(Icons.medical_services,
                          color: _brandColor, size: 32),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('GAMCA Medical Booking',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Text(
                              'Official medical examination booking for GCC employers',
                              style: TextStyle(
                                  color: Theme.of(context).brightness ==
                                          Brightness.dark
                                      ? Colors.grey[400]
                                      : Colors.black54)),
                        ],
                      ),
                    ),
                    _statusChip(),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Progress
            Text('Profile completion: $percent%'),
            const SizedBox(height: 6),
            ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                    value: percent / 100, color: _brandColor, minHeight: 8)),
            const SizedBox(height: 16),

            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(children: [
                    Expanded(
                        child: _buildTextField(
                            firstNameController, 'First Name', Icons.person)),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _buildTextField(lastNameController, 'Last Name',
                            Icons.person_outline)),
                  ]),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                        child: _buildTextField(dobController, 'Date of Birth',
                            Icons.calendar_today,
                            hint: 'DD/MM/YYYY')),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _buildTextField(passportNoController,
                            'Passport Number', Icons.document_scanner)),
                  ]),
                  const SizedBox(height: 12),
                  _buildTextField(
                      nationalityController, 'Nationality', Icons.flag),
                  const SizedBox(height: 16),

                  // Document uploads
                  const Text('Upload Documents',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  _uploadCard(
                      'Passport Photo',
                      passportPhotoFile,
                      () => pickFile(
                          (f) => setState(() => passportPhotoFile = f))),
                  const SizedBox(height: 10),
                  _uploadCard('National ID Copy', idCopyFile,
                      () => pickFile((f) => setState(() => idCopyFile = f))),
                  const SizedBox(height: 16),

                  _buildTextField(
                      mobileController, 'Mobile Number', Icons.phone,
                      hint: '07XXXXXXXX'),
                  const SizedBox(height: 18),

                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(10)),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700),
                        const SizedBox(width: 10),
                        Expanded(
                            child: Text(
                          'Fee: USD 25 (approx KES 3,750). Secure M-Pesa payment.',
                          style: TextStyle(color: Colors.blue.shade700),
                        )),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  SizedBox(
                    height: 54,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                          backgroundColor: _brandColor,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10))),
                      onPressed: _payAndBook,
                      child: const Text('Pay & Book GAMCA Medical — USD 25',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController c, String label, IconData icon,
      {String? hint}) {
    return TextFormField(
      controller: c,
      validator: (v) =>
          v == null || v.trim().isEmpty ? 'Please enter $label' : null,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Theme.of(context).brightness == Brightness.dark
            ? Colors.grey[800]
            : Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding:
            const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      ),
      style: TextStyle(
          color: Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black87,
          fontSize: 16),
    );
  }

  Widget _uploadCard(String title, String? file, VoidCallback onTap) {
    final uploaded = file != null;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: uploaded ? Colors.green.shade50 : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: uploaded ? Colors.green.shade300 : Colors.grey.shade300),
          ),
          child: Row(
            children: [
              Icon(uploaded ? Icons.check_circle : Icons.cloud_upload_outlined,
                  color: uploaded ? Colors.green : Colors.grey.shade600),
              const SizedBox(width: 12),
              Expanded(
                  child: Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w600))),
              const SizedBox(width: 8),
              Text(uploaded ? 'Uploaded' : 'Tap to upload',
                  style: TextStyle(
                      color: uploaded ? Colors.green : Colors.grey.shade600,
                      fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
