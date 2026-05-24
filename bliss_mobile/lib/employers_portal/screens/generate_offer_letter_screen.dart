import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class GenerateOfferLetterScreen extends StatefulWidget {
  const GenerateOfferLetterScreen({super.key});

  @override
  _GenerateOfferLetterScreenState createState() =>
      _GenerateOfferLetterScreenState();
}

class _GenerateOfferLetterScreenState
    extends State<GenerateOfferLetterScreen> {
  final TextEditingController jobTitleController = TextEditingController();
  final TextEditingController jobDescriptionController =
      TextEditingController();
  final TextEditingController salaryController = TextEditingController();
  final TextEditingController requirementsController =
      TextEditingController();
  final TextEditingController benefitsController = TextEditingController();
  final TextEditingController companyNameController = TextEditingController();
  final TextEditingController companyContactsController =
      TextEditingController();

  @override
  void dispose() {
    jobTitleController.dispose();
    jobDescriptionController.dispose();
    salaryController.dispose();
    requirementsController.dispose();
    benefitsController.dispose();
    companyNameController.dispose();
    companyContactsController.dispose();
    super.dispose();
  }

  Future<void> generatePDF() async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        margin: const pw.EdgeInsets.all(24),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(companyNameController.text,
                  style:  pw.TextStyle(
                      fontSize: 24, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Text("Contact: ${companyContactsController.text}"),
              pw.Divider(),
              pw.Text("Job Title:",
                  style:  pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(jobTitleController.text),
              pw.SizedBox(height: 10),
              pw.Text("Job Description:",
                  style:  pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(jobDescriptionController.text),
              pw.SizedBox(height: 10),
              pw.Text("Salary:",
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(salaryController.text),
              pw.SizedBox(height: 10),
              pw.Text("Requirements:",
                  style:  pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(requirementsController.text),
              pw.SizedBox(height: 10),
              pw.Text("Benefits:",
                  style:  pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(benefitsController.text),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 40, width: 40),
            SizedBox(width: 12),
            Text(
              "Generate Offer Letter",
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 18,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: companyNameController,
              decoration: const InputDecoration(labelText: "Company Name"),
            ),
            TextField(
              controller: companyContactsController,
              decoration: const InputDecoration(labelText: "Company Contacts"),
            ),
            TextField(
              controller: jobTitleController,
              decoration: const InputDecoration(labelText: "Job Title"),
            ),
            TextField(
              controller: jobDescriptionController,
              decoration:
                  const InputDecoration(labelText: "Job Description"),
              maxLines: 3,
            ),
            TextField(
              controller: salaryController,
              decoration: const InputDecoration(
                  labelText: "Salary (Employer writes currency themselves)"),
            ),
            TextField(
              controller: requirementsController,
              decoration: const InputDecoration(labelText: "Requirements"),
              maxLines: 3,
            ),
            TextField(
              controller: benefitsController,
              decoration: const InputDecoration(labelText: "Benefits"),
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: generatePDF,
              child: const Text("Generate PDF"),
            ),
          ],
        ),
      ),
    );
  }
}
