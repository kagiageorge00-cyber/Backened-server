import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class EmployerPostJobScreen extends StatefulWidget {
  final String employerId;
  final String employerName;
  final String companyName;

  const EmployerPostJobScreen({
    super.key,
    required this.employerId,
    required this.employerName,
    required this.companyName,
  });

  @override
  State<EmployerPostJobScreen> createState() => _EmployerPostJobScreenState();
}

class _EmployerPostJobScreenState extends State<EmployerPostJobScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _jobTitle = TextEditingController();
  final TextEditingController _jobDescription = TextEditingController();
  final TextEditingController _salary = TextEditingController();
  final TextEditingController _location = TextEditingController();
  final TextEditingController _requirements = TextEditingController();
  final TextEditingController _deploymentFee = TextEditingController();

  String _jobType = 'Full-time';
  String _localOrInternational = 'Local';
  String _deploymentMode = 'Company';

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _setDeploymentFeeForType();
  }

  void _setDeploymentFeeForType() {
    if (_localOrInternational == 'Local') {
      _deploymentFee.text = '600';
    } else {
      _deploymentFee.text = '1000';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          "Post a New Job",
          style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Form Container with styling
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 8,
                    )
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel("Job Title"),
                        _buildInput(_jobTitle, "Enter job title"),
                        _buildLabel("Job Description"),
                        _buildInput(_jobDescription, "Describe the job",
                            maxLines: 5),
                        _buildLabel("Salary (USD)"),
                        _buildInput(_salary, "Salary e.g 500",
                            keyboardType: TextInputType.number),
                        _buildLabel("Location"),
                        _buildInput(_location, "Dubai / Saudi / Qatar / Iraq"),
                        _buildLabel("Required Skills / Requirements"),
                        _buildInput(
                            _requirements, "e.g Age 21-38, experience 2 years",
                            maxLines: 3),
                        const SizedBox(height: 8),
                        _buildLabel("Job Type"),
                        DropdownButtonFormField<String>(
                          initialValue: _jobType,
                          items: const [
                            DropdownMenuItem(
                                value: 'Full-time', child: Text('Full-time')),
                            DropdownMenuItem(
                                value: 'Part-time', child: Text('Part-time')),
                            DropdownMenuItem(
                                value: 'Contract', child: Text('Contract')),
                            DropdownMenuItem(
                                value: 'Freelance', child: Text('Freelance')),
                          ],
                          decoration: const InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 12)),
                          onChanged: (value) {
                            if (value != null) setState(() => _jobType = value);
                          },
                        ),
                        const SizedBox(height: 8),
                        _buildLabel("Local / International"),
                        DropdownButtonFormField<String>(
                          initialValue: _localOrInternational,
                          items: const [
                            DropdownMenuItem(
                                value: 'Local',
                                child: Text('Local Candidates')),
                            DropdownMenuItem(
                                value: 'International',
                                child: Text('International Candidates')),
                          ],
                          decoration: const InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 12)),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() {
                                _localOrInternational = value;
                                _setDeploymentFeeForType();
                              });
                            }
                          },
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _localOrInternational == 'Local'
                              ? 'Local deployment fee automatically set to USD 600'
                              : 'International deployment fee automatically set to USD 1000',
                          style:
                              TextStyle(color: Colors.grey[700], fontSize: 12),
                        ),
                        const SizedBox(height: 8),
                        _buildLabel("Deployment Mode"),
                        DropdownButtonFormField<String>(
                          initialValue: _deploymentMode,
                          items: const [
                            DropdownMenuItem(
                                value: 'Company',
                                child: Text('Company Deployment')),
                            DropdownMenuItem(
                                value: 'Individual',
                                child: Text('Individual Deployment')),
                          ],
                          decoration: const InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 12)),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => _deploymentMode = value);
                            }
                          },
                        ),
                        const SizedBox(height: 8),
                        _buildLabel("Deployment Fee (USD)"),
                        _buildInput(_deploymentFee, "Enter deployment fee",
                            keyboardType: TextInputType.number),
                        const SizedBox(height: 4),
                        Text(
                          'Local defaults to 600, International defaults to 1000',
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 18),
              Text('Employer: ${widget.employerName} (${widget.companyName})',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),

              // Submit Button with shadow
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 8,
                    )
                  ],
                ),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _isSubmitting ? null : _submitJob,
                    child: _isSubmitting
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            "Post Job",
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, top: 14),
      child: Text(
        text,
        style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white
                : Colors.black87),
      ),
    );
  }

  Widget _buildInput(TextEditingController controller, String hint,
      {int maxLines = 1, TextInputType keyboardType = TextInputType.text}) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: (value) => value == null || value.isEmpty ? 'Required' : null,
      style: const TextStyle(color: Colors.black87, fontSize: 16),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.white70
              : Colors.grey[600],
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Future<void> _submitJob() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      await FirebaseFirestore.instance.collection('jobs').add({
        'employerId': widget.employerId,
        'employerName': widget.employerName,
        'companyName': widget.companyName,
        'jobTitle': _jobTitle.text.trim(),
        'jobDescription': _jobDescription.text.trim(),
        'salary': double.tryParse(_salary.text.trim()) ?? 0,
        'location': _location.text.trim(),
        'requirements': _requirements.text.trim(),
        'jobType': _jobType,
        'localOrInternational': _localOrInternational,
        'deploymentMode': _deploymentMode,
        'deploymentFee': double.tryParse(_deploymentFee.text.trim()) ?? 0,
        'createdAt': FieldValue.serverTimestamp(),
        'vacancies': 1,
        'currency': 'USD',
        'status': 'Open',
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job posted successfully!')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error posting job: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _jobTitle.dispose();
    _jobDescription.dispose();
    _salary.dispose();
    _location.dispose();
    _requirements.dispose();
    _deploymentFee.dispose();
    super.dispose();
  }
}
