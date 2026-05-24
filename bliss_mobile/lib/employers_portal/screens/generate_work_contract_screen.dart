import 'package:flutter/material.dart';

class GenerateWorkContractScreen extends StatefulWidget {
  final String employerId;
  final String jobId;
  final String jobTitle;

  const GenerateWorkContractScreen({
    super.key,
    required this.employerId,
    required this.jobId,
    required this.jobTitle,
  });

  @override
  State<GenerateWorkContractScreen> createState() => _GenerateWorkContractScreenState();
}

class _GenerateWorkContractScreenState extends State<GenerateWorkContractScreen> {
  final TextEditingController employerName = TextEditingController();
  final TextEditingController companyName = TextEditingController();
  final TextEditingController candidateName = TextEditingController();
  final TextEditingController contractTerms = TextEditingController();
  final TextEditingController salary = TextEditingController();
  final TextEditingController jobLocation = TextEditingController();
  final TextEditingController startDate = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          "Generate Work Contract",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Contract Details",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),

            _inputField("Employer Name", employerName),
            _inputField("Company Name", companyName),
            _inputField("Candidate Name", candidateName),
            _inputField("Job Location", jobLocation),
            _inputField("Salary (Employer will type currency)", salary),
            _inputField("Start Date", startDate),
            _inputField("Contract Terms", contractTerms, maxLines: 6),

            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  _generateContract();
                },
                child: const Text("Generate PDF Contract"),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _inputField(String label, TextEditingController ctrl, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(),
        ),
      ),
    );
  }

  void _generateContract() {
    if (
      employerName.text.isEmpty ||
      companyName.text.isEmpty ||
      candidateName.text.isEmpty ||
      salary.text.isEmpty ||
      contractTerms.text.isEmpty
    ) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill all required fields")),
      );
      return;
    }

    Navigator.pushNamed(
      context,
      '/previewGeneratedContract',
      arguments: {
        'employerName': employerName.text,
        'companyName': companyName.text,
        'candidateName': candidateName.text,
        'salary': salary.text,
        'jobLocation': jobLocation.text,
        'startDate': startDate.text,
        'contractTerms': contractTerms.text,
        'jobId': widget.jobId,
        'jobTitle': widget.jobTitle,
      },
    );
  }
}
