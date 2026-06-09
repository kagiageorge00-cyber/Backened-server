import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';

import 'job_application_payment_screen.dart';

class JobApplicationPageScreen extends StatefulWidget {
  static const routeName = '/jobApplication';

  const JobApplicationPageScreen({super.key});

  @override
  State<JobApplicationPageScreen> createState() =>
      _JobApplicationPageScreenState();
}

class _JobApplicationPageScreenState extends State<JobApplicationPageScreen> {
  final _formKey = GlobalKey<FormState>();

  // ======================
  // CONTROLLERS
  // ======================
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _position = TextEditingController();
  final _salary = TextEditingController();
  final _experience = TextEditingController();
  final _passportNumber = TextEditingController();
  final _newSkill = TextEditingController();
  final _noOfChildren = TextEditingController();

  String? _country;
  String? _nationality;
  String? _jobCategory;
  String? _maritalStatus;
  String? _religion;
  String? _educationalLevel;
  String _jobType = "local";
  DateTime? _applicationDate;
  final List<String> _skills = [];

  final bool _loading = false;

  // ======================
  // COUNTRIES
  // ======================
  final List<String> countries = [
    "Kenya",
    "Uganda",
    "Tanzania",
    "Rwanda",
    "South Sudan",
    "Nigeria",
    "Ghana",
    "South Africa",
    "UAE",
    "Qatar",
    "Saudi Arabia",
    "Kuwait",
    "Oman",
    "Canada",
    "USA",
    "UK",
    "Germany"
  ];

  // ======================
  // NATIONALITIES
  // ======================
  final List<String> nationalities = [
    "Kenyan",
    "Ugandan",
    "Tanzanian",
    "Rwandan",
    "South Sudanese",
    "Nigerian",
    "Ghanaian",
    "South African",
    "Emirati",
    "Qatari",
    "Saudi",
    "Kuwaiti",
    "Omani",
    "Canadian",
    "American",
    "British",
    "German"
  ];

  // ======================
  // MARITAL STATUS
  // ======================
  final List<String> maritalStatusOptions = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated"
  ];

  // ======================
  // RELIGIONS
  // ======================
  final List<String> religions = [
    "Christianity",
    "Islam",
    "Judaism",
    "Hinduism",
    "Buddhism",
    "Sikhism",
    "Atheism",
    "Agnosticism",
    "Other"
  ];

  // ======================
  // EDUCATIONAL LEVELS
  // ======================
  final List<String> educationalLevels = [
    "Primary",
    "Secondary",
    "Vocational/Technical",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Other"
  ];

  // ======================
  // JOBS
  // ======================
  final List<String> jobs = [
    "House Help",
    "Driver",
    "Cleaner",
    "Security Guard",
    "Chef",
    "Hotel Staff",
    "Construction Worker",
    "Caregiver",
    "Shop Attendant",
    "Warehouse Worker",
  ];

  // ======================
  // NAVIGATE TO PAYMENT
  // ======================
  Future<void> _goToPayment() async {
    if (!_formKey.currentState!.validate()) return;

    // Validate required fields
    if (_country == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a country')),
      );
      return;
    }

    if (_nationality == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select nationality')),
      );
      return;
    }

    if (_maritalStatus == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select marital status')),
      );
      return;
    }

    if (_religion == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select religion')),
      );
      return;
    }

    if (_educationalLevel == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select educational level')),
      );
      return;
    }

    if (_skills.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one skill')),
      );
      return;
    }

    if (_applicationDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select application date')),
      );
      return;
    }

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => JobApplicationPaymentScreen(
          candidateId: _phone.text.trim(),
          jobId: _jobCategory ?? "general",
          fullName: _fullName.text.trim(),
          phoneNumber: _phone.text.trim(),
          email: _email.text.trim(),
        ),
      ),
    );

    if (result == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Payment submitted. Admin approval is required before you can continue registration.'),
        ),
      );
    }
  }

  // ======================
  // UI
  // ======================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 2,
        title: const Row(
          children: [
            Logo(height: 40, width: 40),
            SizedBox(width: 10),
            Text(
              "Bliss Connect",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
      body: Container(
        color: Colors.grey.shade100,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    const Text(
                      "Apply for Job",
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 20),
                    // BASIC INFORMATION
                    const Text(
                      "Basic Information",
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _input(_fullName, "Full Name"),
                    _input(_email, "Email"),
                    _input(_phone, "Phone"),
                    _input(_passportNumber, "Passport Number"),
                    const SizedBox(height: 15),
                    // PROFESSIONAL INFORMATION
                    const Text(
                      "Professional Information",
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _input(_position, "Position"),
                    _input(_salary, "Expected Salary"),
                    _input(_experience, "Experience (Years)"),
                    const SizedBox(height: 10),
                    // SKILLS SECTION
                    const Text("Skills",
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _newSkill,
                            decoration: InputDecoration(
                              labelText: "Add Skill",
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: _addSkill,
                          icon: const Icon(Icons.add),
                          label: const Text("Add"),
                        ),
                      ],
                    ),
                    if (_skills.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: _skills
                            .map(
                              (skill) => Chip(
                                label: Text(skill),
                                onDeleted: () => _removeSkill(skill),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                    const SizedBox(height: 15),
                    // PERSONAL INFORMATION
                    const Text(
                      "Personal Information",
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _maritalStatus,
                      hint: const Text("Select Marital Status"),
                      isExpanded: true,
                      items: maritalStatusOptions
                          .map((e) => DropdownMenuItem(
                                value: e,
                                child: Text(e),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _maritalStatus = v),
                      validator: (v) =>
                          v == null ? "Select marital status" : null,
                    ),
                    const SizedBox(height: 10),
                    _input(_noOfChildren, "Number of Children"),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _nationality,
                      hint: const Text("Select Nationality"),
                      isExpanded: true,
                      items: nationalities
                          .map((e) => DropdownMenuItem(
                                value: e,
                                child: Text(e),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _nationality = v),
                      validator: (v) => v == null ? "Select nationality" : null,
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _religion,
                      hint: const Text("Select Religion"),
                      isExpanded: true,
                      items: religions
                          .map((e) => DropdownMenuItem(
                                value: e,
                                child: Text(e),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _religion = v),
                      validator: (v) => v == null ? "Select religion" : null,
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _educationalLevel,
                      hint: const Text("Select Educational Level"),
                      isExpanded: true,
                      items: educationalLevels
                          .map((e) => DropdownMenuItem(
                                value: e,
                                child: Text(e),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _educationalLevel = v),
                      validator: (v) =>
                          v == null ? "Select educational level" : null,
                    ),
                    const SizedBox(height: 15),
                    // APPLICATION DATE
                    const Text("Application Date",
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _selectApplicationDate,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _applicationDate == null
                              ? 'Select Application Date'
                              : 'Application Date: ${_applicationDate!.toLocal().toString().split(' ')[0]}',
                          style: TextStyle(
                            color: _applicationDate == null
                                ? Colors.grey
                                : Colors.black,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    // LOCATION INFORMATION
                    const Text(
                      "Location Information",
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _country,
                      hint: const Text("Select Country"),
                      isExpanded: true,
                      items: countries
                          .map((e) => DropdownMenuItem(
                                value: e,
                                child: Text(e),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _country = v),
                      validator: (v) => v == null ? "Select country" : null,
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _jobCategory,
                      hint: const Text("Job Category"),
                      isExpanded: true,
                      items: jobs
                          .map((e) => DropdownMenuItem(
                                value: e,
                                child: Text(e),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _jobCategory = v),
                      validator: (v) =>
                          v == null ? "Select job category" : null,
                    ),
                    const SizedBox(height: 15),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Job Type",
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        Row(
                          children: [
                            Radio(
                              value: "local",
                              groupValue: _jobType,
                              onChanged: (v) =>
                                  setState(() => _jobType = v.toString()),
                            ),
                            const Text("Local"),
                            Radio(
                              value: "international",
                              groupValue: _jobType,
                              onChanged: (v) =>
                                  setState(() => _jobType = v.toString()),
                            ),
                            const Text("International"),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 15),
                    const Text(
                      'After payment approval, upload your passport, medical report, photo and video on the Candidate Documents screen.',
                      style: TextStyle(color: Colors.black54),
                    ),
                    const SizedBox(height: 25),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _goToPayment,
                        child: _loading
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : const Text(
                                "Apply & Pay",
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ======================
  // ADD SKILL
  // ======================
  void _addSkill() {
    if (_newSkill.text.isNotEmpty) {
      setState(() {
        _skills.add(_newSkill.text);
        _newSkill.clear();
      });
    }
  }

  // ======================
  // REMOVE SKILL
  // ======================
  void _removeSkill(String skill) {
    setState(() {
      _skills.remove(skill);
    });
  }

  // ======================
  // SELECT APPLICATION DATE
  // ======================
  Future<void> _selectApplicationDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _applicationDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      setState(() {
        _applicationDate = picked;
      });
    }
  }

  // ======================
  // INPUT
  // ======================
  Widget _input(TextEditingController c, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: c,
        validator: (v) => v == null || v.isEmpty ? "Enter $label" : null,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}
