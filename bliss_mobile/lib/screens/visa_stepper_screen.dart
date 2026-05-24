// lib/screens/visa_stepper_screen.dart
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';

/// Stepper-based Visa Application Screen
class VisaStepperScreen extends StatefulWidget {
  const VisaStepperScreen({super.key});

  @override
  State<VisaStepperScreen> createState() => _VisaStepperScreenState();
}

class _VisaStepperScreenState extends State<VisaStepperScreen> {
  final _formKey = GlobalKey<FormState>();

  // ---------- FORM FIELDS ----------
  String? selectedCountry;
  String? selectedVisaType;
  int durationDays = 30;
  String fullName = '';
  String email = '';
  String phone = '';
  Map<String, PlatformFile> uploadedFiles = {};

  // stepper
  int _currentStep = 0;
  bool _submitting = false;

  // ---------- Sample data ----------
  // Replace or expand this map with real official amounts and visa types.
  static const Map<String, Map<String, dynamic>> COUNTRY_DATA = {
    "United Arab Emirates": {
      "visa_types": ["Tourist", "Work", "Visit", "Transit"],
      "official_amount": 100.0,
      "required_docs": [
        "Passport (valid 6+ months)",
        "Passport photo (white background)",
        "Invitation letter (if any)",
        "Bank statement (3 months)"
      ]
    },
    "Kenya": {
      "visa_types": ["E-Visa (Tourist)", "Work Permit"],
      "official_amount": 50.0,
      "required_docs": [
        "Passport (6+ months)",
        "Passport photo",
        "Travel itinerary"
      ]
    },
    "Saudi Arabia": {
      "visa_types": ["Tourist", "Work", "Umrah"],
      "official_amount": 150.0,
      "required_docs": [
        "Passport (6+ months)",
        "Passport photo",
        "Sponsor letter (for work)"
      ]
    },
    "United States": {
      "visa_types": ["B1/B2 (Tourist/Business)", "H1-B", "F1"],
      "official_amount": 160.0,
      "required_docs": [
        "Passport (6+ months)",
        "Photo",
        "DS-160 confirmation",
        "Interview appointment letter"
      ]
    },
  };

  // helper to compute our price = 50% of official site amount
  double computeFee(String country) {
    final info = COUNTRY_DATA[country];
    if (info == null) return 0.0;
    final official = (info['official_amount'] as num).toDouble();
    return (official * 0.5);
  }

  // ---------- File picker ----------
  Future<void> pickFile(String key, List<String> allowedExtensions) async {
    final res = await FilePicker.platform.pickFiles(
      type: allowedExtensions.isEmpty ? FileType.any : FileType.custom,
      allowedExtensions: allowedExtensions,
      withData: true,
    );
    if (res == null) return;
    setState(() {
      uploadedFiles[key] = res.files.first;
    });
  }

  // ---------- Submit to Firestore ----------
  Future<void> submitApplication() async {
    if (!_formKey.currentState!.validate()) return;
    if (selectedCountry == null || selectedVisaType == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Select country and visa type")));
      return;
    }

    setState(() => _submitting = true);
    _formKey.currentState!.save();

    final fee = computeFee(selectedCountry!);
    final data = {
      "name": fullName,
      "email": email,
      "phone": phone,
      "country": selectedCountry,
      "visa_type": selectedVisaType,
      "duration_days": durationDays,
      "fee_calculated": fee,
      "required_documents": COUNTRY_DATA[selectedCountry]!['required_docs'],
      "uploaded_files_meta": uploadedFiles.map((k, v) => MapEntry(k, {
            "name": v.name,
            "size": v.size,
            "extension": v.extension,
          })),
      "created_at": FieldValue.serverTimestamp(),
      "status": "pending",
    };

    try {
      await FirebaseFirestore.instance.collection('visa_applications').add(data);
      setState(() {
        uploadedFiles.clear();
        selectedCountry = null;
        selectedVisaType = null;
        _currentStep = 0;
      });

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Application submitted. Our team will contact you.")));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error submitting: $e")));
    } finally {
      setState(() => _submitting = false);
    }
  }

  // ---------- UI ----------
  @override
  Widget build(BuildContext context) {
    final countries = COUNTRY_DATA.keys.toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text("Visa Application"),
          ],
        ),
      ),
      body: Stepper(
        physics: const ClampingScrollPhysics(),
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep == 0) {
            if (selectedCountry == null) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please choose a country")));
              return;
            }
          }
          if (_currentStep == 1) {
            if (selectedVisaType == null) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please choose a visa type")));
              return;
            }
          }

          if (_currentStep < 3) {
            setState(() => _currentStep += 1);
          } else {
            // last step - attempt submit
            submitApplication();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          } else {
            Navigator.maybePop(context);
          }
        },
        steps: [
          // Step 0: Country selection
          Step(
            title: const Text("Country"),
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: selectedCountry,
                  items: countries.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (v) {
                    setState(() {
                      selectedCountry = v;
                      selectedVisaType = null;
                    });
                  },
                  decoration: const InputDecoration(labelText: "Select country"),
                ),
                const SizedBox(height: 8),
                if (selectedCountry != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      Text("Official fee (site): ${COUNTRY_DATA[selectedCountry]!['official_amount']}"),
                      Text("Our calculated fee (50%): ${computeFee(selectedCountry!).toStringAsFixed(2)}"),
                      const SizedBox(height: 8),
                      const Text("Required documents:", style: TextStyle(fontWeight: FontWeight.bold)),
                      for (final doc in (COUNTRY_DATA[selectedCountry]!['required_docs'] as List))
                        Text("• $doc"),
                    ],
                  ),
              ],
            ),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
          ),

          // Step 1: Visa Type
          Step(
            title: const Text("Visa Type"),
            content: Column(
              children: [
                if (selectedCountry == null) const Text("Select a country first"),
                if (selectedCountry != null)
                  DropdownButtonFormField<String>(
                    initialValue: selectedVisaType,
                    items: (COUNTRY_DATA[selectedCountry]!['visa_types'] as List).map((t) => DropdownMenuItem(value: t as String, child: Text(t))).toList(),
                    onChanged: (v) => setState(() => selectedVisaType = v),
                    decoration: const InputDecoration(labelText: "Select visa type"),
                  ),
              ],
            ),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
          ),

          // Step 2: Duration & Personal details
          Step(
            title: const Text("Duration & Details"),
            content: Form(
              key: _formKey,
              child: Column(
                children: [
                  // duration slider
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Duration (days)"),
                      Text(durationDays.toString()),
                    ],
                  ),
                  Slider(
                    value: durationDays.toDouble(),
                    min: 7,
                    max: 365,
                    divisions: 50,
                    label: "$durationDays days",
                    onChanged: (v) => setState(() => durationDays = v.toInt()),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    decoration: const InputDecoration(labelText: "Full Name"),
                    validator: (v) => (v == null || v.trim().isEmpty) ? "Enter full name" : null,
                    onSaved: (v) => fullName = v!.trim(),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    decoration: const InputDecoration(labelText: "Email"),
                    validator: (v) => (v == null || !v.contains("@")) ? "Enter valid email" : null,
                    onSaved: (v) => email = v!.trim(),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    decoration: const InputDecoration(labelText: "Phone"),
                    validator: (v) => (v == null || v.trim().length < 7) ? "Enter phone" : null,
                    onSaved: (v) => phone = v!.trim(),
                  ),
                ],
              ),
            ),
            isActive: _currentStep >= 2,
            state: _currentStep > 2 ? StepState.complete : StepState.indexed,
          ),

          // Step 3: Upload documents & review
          Step(
            title: const Text("Upload & Review"),
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Upload your documents (pick 1 by 1)"),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => pickFile('passport', ['pdf', 'jpg', 'png']),
                  icon: const Icon(Icons.upload_file),
                  label: Text(uploadedFiles['passport']?.name ?? 'Upload Passport/ID'),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => pickFile('photo', ['jpg', 'png']),
                  icon: const Icon(Icons.photo),
                  label: Text(uploadedFiles['photo']?.name ?? 'Upload Passport Photo'),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => pickFile('bank', ['pdf', 'jpg', 'png']),
                  icon: const Icon(Icons.attach_file),
                  label: Text(uploadedFiles['bank']?.name ?? 'Upload Bank Statement'),
                ),
                const SizedBox(height: 16),
                Text("Calculated fee: ${selectedCountry != null ? computeFee(selectedCountry!).toStringAsFixed(2) : 'N/A'}"),
                const SizedBox(height: 8),
                if (_submitting) const Center(child: CircularProgressIndicator()),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _submitting ? null : submitApplication,
                  child: const Text("Submit Application"),
                ),
              ],
            ),
            isActive: _currentStep >= 3,
            state: _currentStep >= 3 ? StepState.indexed : StepState.disabled,
          ),
        ],
      ),
    );
  }
}
