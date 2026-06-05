import 'package:flutter/material.dart';
import 'package:bliss_mobile/firebase_stub.dart';
import '../widgets/payment_helper.dart';
// import 'package:file_picker/file_picker.dart'; // Uncomment if using file_picker

class TravelDocumentsScreen extends StatefulWidget {
  const TravelDocumentsScreen({super.key});

  @override
  _TravelDocumentsScreenState createState() => _TravelDocumentsScreenState();
}

class _TravelDocumentsScreenState extends State<TravelDocumentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Controllers for forms
  final TextEditingController _passportFeeController = TextEditingController();
  final TextEditingController _birthFeeController = TextEditingController();
  final TextEditingController _medicalNameController = TextEditingController();
  final TextEditingController _medicalPhoneController = TextEditingController();
  final TextEditingController _invitationNameController =
      TextEditingController();
  final TextEditingController _invitationPhoneController =
      TextEditingController();
  final TextEditingController _workPermitNameController =
      TextEditingController();
  final TextEditingController _workPermitPhoneController =
      TextEditingController();

  String _invitationCountry = 'Select Country';
  String _workPermitCountry = 'Select Country';

  final List<String> countries = [
    'Kenya',
    'UAE',
    'USA',
    'Canada',
    'UK',
    'Germany',
    'Turkey'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _passportFeeController.dispose();
    _birthFeeController.dispose();
    _medicalNameController.dispose();
    _medicalPhoneController.dispose();
    _invitationNameController.dispose();
    _invitationPhoneController.dispose();
    _workPermitNameController.dispose();
    _workPermitPhoneController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  // Dummy file picker
  Future<void> pickFile(String type) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$type file picker tapped')),
    );
  }

  /// Unified payment method for all travel documents
  Future<void> _processPayment({
    required String documentType,
    required String fullName,
    required String phoneNumber,
    required double amount,
    required String title,
  }) async {
    if (fullName.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your full name')),
      );
      return;
    }

    if (phoneNumber.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your phone number')),
      );
      return;
    }

    final String phone = phoneNumber.startsWith('0')
        ? '254${phoneNumber.substring(1)}'
        : phoneNumber;

    final bool success = await showUnifiedPaymentDialog(
      context,
      payerName: fullName.trim(),
      payerPhone: phone,
      amount: amount,
      title: title,
      associatedId:
          'TD_${documentType}_${DateTime.now().millisecondsSinceEpoch}',
    );

    if (success) {
      // Save booking to Firestore
      try {
        await FirebaseFirestore.instance
            .collection('travel_document_bookings')
            .add({
          'documentType': documentType,
          'candidateName': fullName.trim(),
          'phoneNumber': phone,
          'amount': amount,
          'status': 'paid',
          'createdAt': FieldValue.serverTimestamp(),
          'country': documentType == 'invitation'
              ? _invitationCountry
              : documentType == 'work_permit'
                  ? _workPermitCountry
                  : null,
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Payment successful! $title has been booked.'),
            backgroundColor: Colors.green,
          ),
        );

        // Clear form
        _medicalNameController.clear();
        _medicalPhoneController.clear();
        _invitationNameController.clear();
        _invitationPhoneController.clear();
        _workPermitNameController.clear();
        _workPermitPhoneController.clear();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving booking: $e')),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Payment cancelled'), backgroundColor: Colors.orange),
      );
    }
  }

  double calculatePassportTotal() {
    double fee = double.tryParse(_passportFeeController.text) ?? 0;
    return fee + 15000;
  }

  double calculateBirthTotal() {
    double fee = double.tryParse(_birthFeeController.text) ?? 0;
    return fee + 3000;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Travel Documents'),
        backgroundColor: Colors.white,
        elevation: 1,
        titleTextStyle: const TextStyle(
          color: Colors.black87,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.blue,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Passport'),
            Tab(text: 'Birth Cert'),
            Tab(text: 'Medical'),
            Tab(text: 'Invitation'),
            Tab(text: 'Work Permit'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ========== PASSPORT TAB ==========
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Passport Application',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                const Text('Additional e-Citizen Fee (if applicable)',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 8),
                TextField(
                  controller: _passportFeeController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'E-Citizen Fee (KES)',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.currency_exchange),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => pickFile('passport'),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Upload Passport Docs'),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Total fee: KES ${calculatePassportTotal().toStringAsFixed(0)}\nIncludes gov fee + platform fee',
                          style: TextStyle(
                              fontSize: 12, color: Colors.blue.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _processPayment(
                      documentType: 'passport',
                      fullName: 'Passport Applicant',
                      phoneNumber: '',
                      amount: calculatePassportTotal(),
                      title:
                          'Passport Application - KES ${calculatePassportTotal().toStringAsFixed(0)}',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade700,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Proceed to Payment'),
                  ),
                ),
              ],
            ),
          ),

          // ========== BIRTH CERTIFICATE TAB ==========
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Birth Certificate',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                const Text('Application Fee',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 8),
                TextField(
                  controller: _birthFeeController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Application Fee (KES)',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.currency_exchange),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => pickFile('birth'),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Upload Birth Certificate Docs'),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.green.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Total fee: KES ${calculateBirthTotal().toStringAsFixed(0)}\nStandard processing',
                          style: TextStyle(
                              fontSize: 12, color: Colors.green.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _processPayment(
                      documentType: 'birth_certificate',
                      fullName: 'Birth Cert Applicant',
                      phoneNumber: '',
                      amount: calculateBirthTotal(),
                      title:
                          'Birth Certificate - KES ${calculateBirthTotal().toStringAsFixed(0)}',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade700,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Proceed to Payment'),
                  ),
                ),
              ],
            ),
          ),

          // ========== MEDICAL TAB ==========
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Medical Examination',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const Text('GAMCA / Normal Medical',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 16),
                TextField(
                  controller: _medicalNameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.person),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _medicalPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    hintText: '07XXXXXXXX',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.phone),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => pickFile('medical'),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Upload Medical Documents'),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.orange.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Medical Fee: KES 7,500\nBooking appointment included',
                          style: TextStyle(
                              fontSize: 12, color: Colors.orange.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _processPayment(
                      documentType: 'medical',
                      fullName: _medicalNameController.text,
                      phoneNumber: _medicalPhoneController.text,
                      amount: 7500,
                      title: 'Medical Examination Booking - KES 7,500',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange.shade700,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Book Medical Appointment'),
                  ),
                ),
              ],
            ),
          ),

          // ========== INVITATION LETTER TAB ==========
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Invitation Letter',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                DropdownButton<String>(
                  value: _invitationCountry,
                  isExpanded: true,
                  items: ['Select Country', ...countries]
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (val) => setState(() => _invitationCountry = val!),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _invitationNameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.person),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _invitationPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    hintText: '07XXXXXXXX',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.phone),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => pickFile('invitation'),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Upload Supporting Documents'),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.purple.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Invitation Fee: KES 30,000\nProcessing time: 5-7 days',
                          style: TextStyle(
                              fontSize: 12, color: Colors.purple.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _processPayment(
                      documentType: 'invitation',
                      fullName: _invitationNameController.text,
                      phoneNumber: _invitationPhoneController.text,
                      amount: 30000,
                      title: 'Invitation Letter - KES 30,000',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple.shade700,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Request Invitation Letter'),
                  ),
                ),
              ],
            ),
          ),

          // ========== WORK PERMIT TAB ==========
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Work Permit Application',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                DropdownButton<String>(
                  value: _workPermitCountry,
                  isExpanded: true,
                  items: ['Select Country', ...countries]
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (val) => setState(() => _workPermitCountry = val!),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _workPermitNameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.person),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _workPermitPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    hintText: '07XXXXXXXX',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.phone),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => pickFile('work'),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Upload Work Permit Documents'),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.red.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Work Permit Fee: KES 90,000\nProcessing time: 7-14 days',
                          style: TextStyle(
                              fontSize: 12, color: Colors.red.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _processPayment(
                      documentType: 'work_permit',
                      fullName: _workPermitNameController.text,
                      phoneNumber: _workPermitPhoneController.text,
                      amount: 90000,
                      title: 'Work Permit Application - KES 90,000',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade700,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Apply for Work Permit'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
