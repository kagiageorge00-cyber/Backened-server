import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

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
      await FirebaseFirestore.instance
          .collection("applications")
          .doc(widget.applicationId)
          .update({
        "status": _status,
        "notes": _notesController.text.trim(),
        "lastUpdated": FieldValue.serverTimestamp(),
      });

      /// Log the update to activity timeline
      await FirebaseFirestore.instance
          .collection("applications")
          .doc(widget.applicationId)
          .collection("activity_log")
          .add({
        "type": "status_update",
        "status": _status,
        "notes": _notesController.text.trim(),
        "timestamp": FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Application status updated successfully"),
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

it('should register a user', async () => {
  const res = await request(app)
    .post('/register')
    .send({
      name: 'Test User',
      email: 'test@test.com',
      phone: '254700000001',
      userType: 'candidate'
    });
  expect(res.body.success).toBe(true);
  expect(res.body.user).toBeDefined();
}, 20000); // <-- Increase timeout to 20 seconds
