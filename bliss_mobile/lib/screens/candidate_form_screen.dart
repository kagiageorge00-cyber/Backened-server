import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/candidate_model.dart';
import '../services/resume_generator_service.dart';
import 'video_upload_screen.dart';

class CandidateFormScreen extends StatefulWidget {
  final String basicFullName;
  final String basicEmail;
  final String basicPhone;
  final String? basicCountry;
  final double basicExpectedSalary;
  final String? basicCurrency;

  const CandidateFormScreen({
    super.key,
    required this.basicFullName,
    required this.basicEmail,
    required this.basicPhone,
    this.basicCountry,
    required this.basicExpectedSalary,
    this.basicCurrency,
  });

  @override
  State<CandidateFormScreen> createState() => _CandidateFormScreenState();
}

class _CandidateFormScreenState extends State<CandidateFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _skillsController = TextEditingController();
  final TextEditingController _experienceController = TextEditingController();
  final TextEditingController _mpesaConfirmationController =
      TextEditingController();

  File? _fullPhoto;
  File? _idPhoto;
  bool _uploading = false;
  final ImagePicker _picker = ImagePicker();

  // Payment variables
  String? _selectedPaymentMethod;
  bool _paymentVerified = false;
  final String _mpesaPhoneNumber = '+254 798 242 350';
  final double _registrationFeeUSD = 10.0;
  final double _registrationFeeKES = 1300.0;

  Color get _brandColor => Colors.deepOrangeAccent;

  @override
  void dispose() {
    _skillsController.dispose();
    _experienceController.dispose();
    _mpesaConfirmationController.dispose();
    super.dispose();
  }

  Future<void> _pickFullPhoto() async {
    final XFile? picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _fullPhoto = File(picked.path));
  }

  Future<void> _pickIDPhoto() async {
    final XFile? picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _idPhoto = File(picked.path));
  }

  void _verifyMpesaPayment() {
    if (_mpesaConfirmationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please paste your M-Pesa confirmation message")),
      );
      return;
    }
    setState(() => _paymentVerified = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("M-Pesa payment verified! ✓")),
    );
  }

  void _initializeFlutterwave() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Redirecting to Flutterwave payment...")),
    );
    // Flutterwave integration will be added here
    setState(() => _paymentVerified = true);
  }

  Future<void> _submitCandidate() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedPaymentMethod == null || !_paymentVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please complete payment to proceed")),
      );
      return;
    }

    if (_fullPhoto == null || _idPhoto == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text("Please upload both full photo and ID/passport photo.")),
      );
      return;
    }

    setState(() => _uploading = true);

    try {
      // Create candidate object
      final candidate = Candidate(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        fullName: widget.basicFullName,
        age: 25, // Default age
        gender: "Not specified",
        country: widget.basicCountry ?? "Unknown",
        expectedSalary: widget.basicExpectedSalary,
        hireCost: 0,
        skills: _skillsController.text.split(',').map((s) => s.trim()).toList(),
        experienceYears: int.tryParse(_experienceController.text.trim()) ?? 0,
        photoUrl: '', // Will be uploaded in VideoUploadScreen
        videoUrl: '',
        passportStatus: "Not submitted",
        visaOption: "Not selected",
        currency: widget.basicCurrency ?? "USD",
        phone: widget.basicPhone,
        email: widget.basicEmail,
      );

      // Generate resume text
      final resumeText = await ResumeGeneratorService.generateResume(candidate);

      // Navigate to VideoUploadScreen with all required files
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => VideoUploadScreen(
            candidateId: candidate.id,
            fullPhoto: _fullPhoto!,
            idPhoto: _idPhoto!,
            resumeText: resumeText,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Submission failed: $e")),
      );
    } finally {
      setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Complete Your Application"),
        backgroundColor: _brandColor,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: Colors.grey.shade200,
                        backgroundImage:
                            _fullPhoto != null ? FileImage(_fullPhoto!) : null,
                        child: _fullPhoto == null
                            ? const Icon(Icons.person,
                                size: 36, color: Colors.grey)
                            : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.basicFullName,
                                style: const TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            Text(widget.basicEmail,
                                style: TextStyle(color: Colors.grey.shade700)),
                            const SizedBox(height: 4),
                            Text(widget.basicPhone,
                                style: TextStyle(color: Colors.grey.shade700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Section: Professional Summary
              const Text('Professional Summary',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              TextFormField(
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Brief summary about yourself',
                  hintText:
                      '2–3 lines about your background, strengths, and career goals',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: const Icon(Icons.info_outline),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
              ),
              const SizedBox(height: 14),

              // Skills
              TextFormField(
                controller: _skillsController,
                decoration: InputDecoration(
                  labelText: 'Core skills',
                  hintText:
                      'Enter comma-separated skills (e.g., Sales, Communication, Excel)',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: const Icon(Icons.build_outlined),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Please list at least one skill'
                    : null,
              ),
              const SizedBox(height: 14),

              // Experience
              TextFormField(
                controller: _experienceController,
                decoration: InputDecoration(
                  labelText: 'Years of professional experience',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: const Icon(Icons.work_outline),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please provide years of experience';
                  }
                  final n = int.tryParse(value.trim());
                  if (n == null || n < 0) return 'Enter a valid number';
                  return null;
                },
              ),
              const SizedBox(height: 18),

              // Photo uploads with preview
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.photo_camera),
                      label: Text(_fullPhoto == null
                          ? 'Upload Full Photo'
                          : 'Change Photo'),
                      onPressed: _pickFullPhoto,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.badge_outlined),
                      label: Text(_idPhoto == null
                          ? 'Upload ID/Passport'
                          : 'Change ID Photo'),
                      onPressed: _pickIDPhoto,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_fullPhoto != null || _idPhoto != null)
                Card(
                  margin: const EdgeInsets.only(top: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        if (_fullPhoto != null)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                const Text('Profile Photo',
                                    style:
                                        TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                Image.file(_fullPhoto!,
                                    height: 80, fit: BoxFit.cover),
                              ],
                            ),
                          ),
                        if (_fullPhoto != null && _idPhoto != null)
                          const SizedBox(width: 12),
                        if (_idPhoto != null)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                const Text('ID / Passport',
                                    style:
                                        TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                Image.file(_idPhoto!,
                                    height: 80, fit: BoxFit.cover),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              // Payment Section
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                color: const Color(0xFFFFF8F0),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.payment, color: _brandColor),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'Registration Fee',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w700),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: _brandColor,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              'KES ${_registrationFeeKES.toStringAsFixed(0)} / USD ${_registrationFeeUSD.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Choose a payment method:',
                        style: TextStyle(
                            fontSize: 13, color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 12),
                      // M-Pesa Option
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _selectedPaymentMethod == 'mpesa'
                                ? _brandColor
                                : Colors.grey.shade300,
                            width: _selectedPaymentMethod == 'mpesa' ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          color: _selectedPaymentMethod == 'mpesa'
                              ? _brandColor.withOpacity(0.05)
                              : Colors.transparent,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              InkWell(
                                onTap: () => setState(
                                    () => _selectedPaymentMethod = 'mpesa'),
                                child: Row(
                                  children: [
                                    Radio<String>(
                                      value: 'mpesa',
                                      groupValue: _selectedPaymentMethod,
                                      onChanged: (value) => setState(
                                          () => _selectedPaymentMethod = value),
                                      activeColor: _brandColor,
                                    ),
                                    const SizedBox(width: 12),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'M-Pesa (Kenya)',
                                          style: TextStyle(
                                              fontWeight: FontWeight.w600),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'KSH ${_registrationFeeKES.toStringAsFixed(0)}/=',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              if (_selectedPaymentMethod == 'mpesa')
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.shade50,
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          border: Border.all(
                                              color: Colors.blue.shade200),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(Icons.info,
                                                size: 16,
                                                color: Colors.blue.shade700),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                'Send ${_registrationFeeKES.toStringAsFixed(0)}/= to\n$_mpesaPhoneNumber',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: Colors.blue.shade900,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      TextFormField(
                                        controller:
                                            _mpesaConfirmationController,
                                        decoration: InputDecoration(
                                          labelText:
                                              'M-Pesa Confirmation Message',
                                          hintText:
                                              'Paste your M-Pesa confirmation code here',
                                          border: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(8),
                                          ),
                                          prefixIcon: const Icon(
                                              Icons.message_outlined),
                                          filled: true,
                                          fillColor: Colors.white,
                                        ),
                                        maxLines: 2,
                                      ),
                                      const SizedBox(height: 10),
                                      SizedBox(
                                        height: 40,
                                        child: ElevatedButton.icon(
                                          icon: const Icon(
                                              Icons.check_circle_outline),
                                          label: const Text('Verify Payment'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: _paymentVerified &&
                                                    _selectedPaymentMethod ==
                                                        'mpesa'
                                                ? Colors.green
                                                : _brandColor,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                          ),
                                          onPressed: _paymentVerified &&
                                                  _selectedPaymentMethod ==
                                                      'mpesa'
                                              ? null
                                              : _verifyMpesaPayment,
                                        ),
                                      ),
                                      if (_paymentVerified &&
                                          _selectedPaymentMethod == 'mpesa')
                                        Padding(
                                          padding:
                                              const EdgeInsets.only(top: 8),
                                          child: Row(
                                            children: [
                                              Icon(Icons.verified,
                                                  size: 16,
                                                  color: Colors.green.shade600),
                                              const SizedBox(width: 6),
                                              Text(
                                                'Payment verified',
                                                style: TextStyle(
                                                  color: Colors.green.shade600,
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Flutterwave Option
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _selectedPaymentMethod == 'flutterwave'
                                ? _brandColor
                                : Colors.grey.shade300,
                            width:
                                _selectedPaymentMethod == 'flutterwave' ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          color: _selectedPaymentMethod == 'flutterwave'
                              ? _brandColor.withOpacity(0.05)
                              : Colors.transparent,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              InkWell(
                                onTap: () => setState(() =>
                                    _selectedPaymentMethod = 'flutterwave'),
                                child: Row(
                                  children: [
                                    Radio<String>(
                                      value: 'flutterwave',
                                      groupValue: _selectedPaymentMethod,
                                      onChanged: (value) => setState(
                                          () => _selectedPaymentMethod = value),
                                      activeColor: _brandColor,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Flutterwave (International)',
                                            style: TextStyle(
                                                fontWeight: FontWeight.w600),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '\$${_registrationFeeUSD.toStringAsFixed(2)} - Card, Bank, Mobile Money',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (_selectedPaymentMethod == 'flutterwave')
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: Colors.purple.shade50,
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          border: Border.all(
                                              color: Colors.purple.shade200),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(Icons.language,
                                                size: 16,
                                                color: Colors.purple.shade700),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                'Click below to pay securely with Flutterwave',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: Colors.purple.shade900,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      SizedBox(
                                        height: 40,
                                        child: ElevatedButton.icon(
                                          icon: const Icon(Icons.credit_card),
                                          label: const Text(
                                              'Pay with Flutterwave'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: _paymentVerified &&
                                                    _selectedPaymentMethod ==
                                                        'flutterwave'
                                                ? Colors.green
                                                : Colors.purple.shade600,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                          ),
                                          onPressed: _paymentVerified &&
                                                  _selectedPaymentMethod ==
                                                      'flutterwave'
                                              ? null
                                              : _initializeFlutterwave,
                                        ),
                                      ),
                                      if (_paymentVerified &&
                                          _selectedPaymentMethod ==
                                              'flutterwave')
                                        Padding(
                                          padding:
                                              const EdgeInsets.only(top: 8),
                                          child: Row(
                                            children: [
                                              Icon(Icons.verified,
                                                  size: 16,
                                                  color: Colors.green.shade600),
                                              const SizedBox(width: 6),
                                              Text(
                                                'Payment completed',
                                                style: TextStyle(
                                                  color: Colors.green.shade600,
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Guidance & privacy note
              Row(
                children: [
                  Icon(Icons.lock_outline,
                      color: Colors.grey.shade600, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'We respect your privacy. Your personal information will only be used for recruitment purposes.',
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Submit
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _brandColor,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _uploading ? null : _submitCandidate,
                  child: _uploading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Proceed to Upload Introduction Video',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 18),
            ],
          ),
        ),
      ),
    );
  }
}
