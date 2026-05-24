import 'dart:io';
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:image_picker/image_picker.dart';
import '../../widgets/payment_helper.dart';

class WorkPermitFormScreen extends StatefulWidget {
  const WorkPermitFormScreen({super.key});

  @override
  State<WorkPermitFormScreen> createState() => _WorkPermitFormScreenState();
}

class _WorkPermitFormScreenState extends State<WorkPermitFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _passportNumberController =
      TextEditingController();
  final TextEditingController _positionController = TextEditingController();
  final TextEditingController _mobileController = TextEditingController();

  File? passportCopy;
  File? photoFile;
  File? contractFile;
  File? educationFile;

  String status = 'Draft';
  bool paymentConfirmed = false;

  Future<void> _pickFile(Function(File) onSelected) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      onSelected(File(picked.path));
      setState(() {});
    }
  }

  Future<void> _payWithMpesa() async {
    if (!_formKey.currentState!.validate()) return;

    if (passportCopy == null || photoFile == null || contractFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please upload all required documents")),
      );
      return;
    }

    if (_mobileController.text.trim().length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter a valid mobile number")),
      );
      return;
    }

    setState(() {
      status = 'Waiting for payment...';
    });

    double amount = 20000; // KES 20,000 for Work Permit

    try {
      final ok = await showUnifiedPaymentDialog(
        context,
        payerName: _fullNameController.text.trim().isNotEmpty
            ? _fullNameController.text.trim()
            : 'Applicant',
        payerPhone: _mobileController.text.trim(),
        amount: amount,
        title: 'Work Permit Payment',
        associatedId: null,
      );

      if (ok) {
        setState(() {
          status = 'Payment received • You can submit application';
          paymentConfirmed = true;
        });
      } else {
        setState(() {
          status = 'Payment failed or cancelled';
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment not completed.')));
      }
    } catch (e) {
      setState(() {
        status = 'Payment failed';
      });
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text("Payment failed: $e")));
    }
  }

  void _submitForm() {
    if (!paymentConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complete payment first')));
      return;
    }

    setState(() {
      status = 'Application submitted';
    });

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Application Submitted'),
        content: const Text(
            'Your Work Permit application has been submitted successfully. Our team will contact you for next steps.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(), child: const Text('OK'))
        ],
      ),
    );
  }

  Widget _statusChip() {
    final color = status.contains('Payment') || paymentConfirmed
        ? Colors.green
        : Colors.orange;
    return Chip(label: Text(status), backgroundColor: color.withOpacity(0.12));
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _passportNumberController.dispose();
    _positionController.dispose();
    _mobileController.dispose();
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
            Text("Work Permit Form"),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _statusChip(),
              const SizedBox(height: 16),
              _buildTextField(_fullNameController, "Full Name"),
              const SizedBox(height: 16),
              _buildTextField(_passportNumberController, "Passport Number"),
              const SizedBox(height: 16),
              _buildTextField(_positionController, "Position / Job Title"),
              const SizedBox(height: 16),
              _buildTextField(_mobileController, "Mobile Number (07XXXXXXXX)"),
              const SizedBox(height: 24),
              _buildUploadButton("Upload Passport Copy", passportCopy,
                  (f) => passportCopy = f),
              const SizedBox(height: 16),
              _buildUploadButton(
                  "Upload Passport Photo", photoFile, (f) => photoFile = f),
              const SizedBox(height: 16),
              _buildUploadButton("Upload Employment Contract", contractFile,
                  (f) => contractFile = f),
              const SizedBox(height: 16),
              _buildUploadButton("Upload Education Certificate (optional)",
                  educationFile, (f) => educationFile = f),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _payWithMpesa,
                  child: const Text("Pay KES 20,000"),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitForm,
                  child: const Text("Submit Application"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label) {
    return TextFormField(
      controller: controller,
      validator: (value) =>
          value == null || value.isEmpty ? "Please enter $label" : null,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Theme.of(context).brightness == Brightness.dark
            ? Colors.grey[800]
            : Colors.white,
      ),
      style: TextStyle(
          color: Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black87,
          fontSize: 16),
    );
  }

  Widget _buildUploadButton(
      String label, File? file, Function(File) onSelected) {
    return Row(
      children: [
        const Icon(Icons.upload_file, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: ElevatedButton(
            onPressed: () => _pickFile(onSelected),
            child: Text(file == null
                ? label
                : "Selected: ${file.path.split('/').last}"),
          ),
        ),
      ],
    );
  }
}
