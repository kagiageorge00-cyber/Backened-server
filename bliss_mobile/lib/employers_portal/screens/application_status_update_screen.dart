import 'package:flutter/material.dart';


class ApplicationStatusUpdateScreen extends StatefulWidget {
  final String applicationId;
  final String candidateName;
  final String jobTitle;

  const ApplicationStatusUpdateScreen({
    super.key,
    required this.applicationId,
    required this.candidateName,
    required this.jobTitle,
  });

  @override
  _ApplicationStatusUpdateScreenState createState() =>
      _ApplicationStatusUpdateScreenState();
}

class _ApplicationStatusUpdateScreenState
    extends State<ApplicationStatusUpdateScreen> {
  final _notesController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  String _status = "Pending Review";
  bool _isSubmitting = false;

  final List<String> statusOptions = [
    "Pending Review",
    "Shortlisted",
    "Interview Scheduled",
    "Interview Completed",
    "Approved",
    "Rejected",
    "Withdrawn by Candidate",
    "Employer Waiting on Documents",
  ];

  Future<void> updateStatus() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      // Replace with your backend API endpoint
      final response = Uri.parse('https://your-backend-api.com/applications/${widget.applicationId}/status').resolveUri(Uri());
      // Example using http package (add http to pubspec.yaml)
      // import 'package:http/http.dart' as http;
      // final res = await http.patch(
      //   response,
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({
      //     "status": _status,
      //     "notes": _notesController.text.trim(),
      //   }),
      // );
      // if (res.statusCode != 200) throw Exception('Failed to update status');

      // Log the update to activity timeline (replace with backend API call)
      // await http.post(
      //   Uri.parse('https://your-backend-api.com/applications/${widget.applicationId}/activity_log'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({
      //     "type": "status_update",
      //     "status": _status,
      //     "notes": _notesController.text.trim(),
      //   }),
      // );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Application status updated successfully (API call)"),
            backgroundColor: Colors.green.shade600,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: $e"),
          backgroundColor: Colors.red.shade600,
        ),
      );
    }

    setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text(
          "Update Status",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Colors.black87,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Candidate Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, 3),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.candidateName,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade800,
                    ),
                  ),
                  SizedBox(height: 5),
                  Text(
                    "Applied for ${widget.jobTitle}",
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 20),

            // Form
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Label
                  Text(
                    "New Status",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.grey.shade800,
                    ),
                  ),
                  SizedBox(height: 10),

                  // Status Dropdown
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 15),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: DropdownButtonFormField<String>(
                      initialValue: _status,
                      decoration: InputDecoration(border: InputBorder.none),
                      items: statusOptions
                          .map(
                            (st) => DropdownMenuItem(
                              value: st,
                              child: Text(st),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setState(() => _status = v!),
                      validator: (value) =>
                          value == null ? "Select a status" : null,
                    ),
                  ),

                  SizedBox(height: 20),

                  // Notes
                  Text(
                    "Notes (Optional)",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.grey.shade800,
                    ),
                  ),
                  SizedBox(height: 10),

                  TextFormField(
                    controller: _notesController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: "Add extra information...",
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                  ),

                  SizedBox(height: 40),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : updateStatus,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade700,
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _isSubmitting
                          ? CircularProgressIndicator(color: Colors.white)
                          : Text(
                              "Update Status",
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const request = require('supertest');
const app = require('../app'); // adjust path to your express app

describe('User Registration', () => {

  it('should register a user', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test User',
        email: 'test@test.com',
        phone: '254700000001',
        password: '123456', // ✅ REQUIRED
        userType: 'candidate'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  }, 20000); // timeout

});
