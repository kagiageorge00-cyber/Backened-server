import 'package:flutter/material.dart';
import '../models/job_model.dart';
import '../services/job_service_http.dart';

class EmployerPostJobScreen extends StatefulWidget {
  const EmployerPostJobScreen({super.key});

  @override
  State<EmployerPostJobScreen> createState() => _EmployerPostJobScreenState();
}

class _EmployerPostJobScreenState extends State<EmployerPostJobScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _companyController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _salaryController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  bool _loading = false;

  Future<void> _postJob() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final job = Job(
        title: _titleController.text.trim(),
        employerName: _companyController.text.trim(),
        employerId: '', // Set appropriately if available
        location: _locationController.text.trim(),
        salary: double.tryParse(_salaryController.text.trim()) ?? 0,
        description: _descriptionController.text.trim(),
        contractType: '',
        postedAt: DateTime.now(),
        expiryDate: null,
        applicantsCount: 0,
      );
      await JobService().createJob(job);

      setState(() => _loading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Job posted successfully 🎉"),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: $e"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.black87)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey.shade100,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 15, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        elevation: 1,
        backgroundColor: Colors.white,
        title: const Text(
          "Post a Job",
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTextField("Job Title", _titleController),
              _buildTextField("Company Name", _companyController),
              _buildTextField("Location", _locationController),
              _buildTextField("Salary (Optional)", _salaryController),
              _buildTextField("Job Description", _descriptionController,
                  maxLines: 5),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _postJob,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.blue.shade700,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2)
                      : const Text(
                          "Post Job",
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
