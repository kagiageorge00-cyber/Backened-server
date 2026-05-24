import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:bliss_mobile/utils/payment_helper.dart';

class VisaApplicationForm extends StatefulWidget {
  const VisaApplicationForm({super.key});

  @override
  State<VisaApplicationForm> createState() => _VisaApplicationFormState();
}

class _VisaApplicationFormState extends State<VisaApplicationForm> {
  final _formKey = GlobalKey<FormState>();

  // Form fields
  String fullName = "";
  String passportNumber = "";
  String phone = "";
  String country = "";
  String visaType = "";
  String notes = "";

  bool isSubmitting = false;
  bool isRushProcessing = false;

  final List<String> countries = [
    "United Arab Emirates",
    "Saudi Arabia",
    "Qatar",
    "Kuwait",
    "Oman",
    "Bahrain",
    "Turkey",
    "Canada",
    "USA",
    "United Kingdom",
  ];

  final List<String> visaTypes = [
    "Work Visa",
    "Tourist Visa",
    "Visit Visa",
    "Student Visa",
    "Residence Visa",
  ];

  // Visa pricing mapping
  final Map<String, double> visaPricing = {
    'Work Visa': 150.0,
    'Tourist Visa': 50.0,
    'Visit Visa': 75.0,
    'Student Visa': 75.0,
    'Residence Visa': 300.0,
  };

  double get visaFee => visaPricing[visaType] ?? 0.0;
  double get rushFee => visaFee * 1.5;
  double get totalCost => isRushProcessing ? rushFee : visaFee;

  // Submit form
  Future<void> submitVisaApplication() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => isSubmitting = true);

    try {
      // Create the visa application via backend HTTP endpoint
      final response = await http.post(
        Uri.parse('https://your-backend-url/api/visa-applications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'passport_number': passportNumber,
          'phone': phone,
          'country': country,
          'visa_type': visaType,
          'notes': notes,
          'visa_fee': visaFee,
          'is_rush_processing': isRushProcessing,
          'total_cost': totalCost,
          'is_currency': 'USD',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final visaId = data['id'] ?? '';

        // Show payment dialog
        bool paymentSuccessful = false;
        if (mounted) {
          paymentSuccessful = await PaymentHelper.showPaymentDialog(
                context: context,
                amount: totalCost,
                description:
                    'Visa Application - $visaType (${isRushProcessing ? 'Rush' : 'Standard'} Processing)',
                reference: 'VISA_$visaId',
              ) ??
              false;
        }

        if (paymentSuccessful) {
          // Update visa application status to payment_verified via backend
          await http.post(
            Uri.parse(
                'https://your-backend-url/api/visa-applications/update-status'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'id': visaId,
              'status': 'payment_verified',
            }),
          );

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    "Visa Application Submitted Successfully! Reference: $visaId"),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 4),
              ),
            );

            _formKey.currentState!.reset();
            setState(() {
              country = "";
              visaType = "";
              isRushProcessing = false;
            });
          }
        } else {
          // Payment failed - delete the application via backend
          await http.post(
            Uri.parse('https://your-backend-url/api/visa-applications/delete'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'id': visaId}),
          );
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Payment cancelled. Application not saved."),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      } else {
        throw Exception('Failed to create visa application');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
      );
    }

    setState(() => isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text("Visa Application Form"),
          ],
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // FULL NAME
              TextFormField(
                decoration: InputDecoration(
                  labelText: "Full Name",
                  border: const OutlineInputBorder(),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? "Enter full name" : null,
                onSaved: (v) => fullName = v!.trim(),
              ),
              const SizedBox(height: 16),

              // PASSPORT NUMBER
              TextFormField(
                decoration: InputDecoration(
                  labelText: "Passport Number",
                  border: const OutlineInputBorder(),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? "Enter passport number"
                    : null,
                onSaved: (v) => passportNumber = v!.trim(),
              ),
              const SizedBox(height: 16),

              // PHONE
              TextFormField(
                decoration: InputDecoration(
                  labelText: "Phone Number",
                  border: const OutlineInputBorder(),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                validator: (v) => (v == null || v.trim().length < 7)
                    ? "Enter valid phone"
                    : null,
                onSaved: (v) => phone = v!.trim(),
              ),
              const SizedBox(height: 16),

              // COUNTRY DROPDOWN
              DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  labelText: "Applying Country",
                  border: const OutlineInputBorder(),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                items: countries
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                initialValue: country.isEmpty ? null : country,
                onChanged: (value) {
                  setState(() => country = value!);
                },
                validator: (v) => v == null ? "Select country" : null,
              ),
              const SizedBox(height: 16),

              // VISA TYPE
              DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  labelText: "Visa Type",
                  border: const OutlineInputBorder(),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                items: visaTypes
                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                initialValue: visaType.isEmpty ? null : visaType,
                onChanged: (value) {
                  setState(() => visaType = value!);
                },
                validator: (v) => v == null ? "Select visa type" : null,
              ),
              const SizedBox(height: 16),

              // NOTES
              TextFormField(
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: "Additional Notes (Optional)",
                  border: const OutlineInputBorder(),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey[800]
                      : Colors.white,
                ),
                style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color ??
                        Colors.black87,
                    fontSize: 16),
                onSaved: (v) => notes = v!.trim(),
              ),
              const SizedBox(height: 24),

              // RUSH PROCESSING OPTION
              Card(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Checkbox(
                            value: isRushProcessing,
                            onChanged: (value) {
                              setState(() => isRushProcessing = value ?? false);
                            },
                          ),
                          const Text(
                            'Rush Processing (+50%)',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Get faster processing within 24-48 hours',
                          style:
                              TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // PRICING SUMMARY
              if (visaType.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Pricing Summary',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Visa Application Fee:'),
                          Text(
                            '\$${visaFee.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      if (isRushProcessing) ...[
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Rush Processing (+50%):'),
                            Text(
                              '\$${(rushFee - visaFee).toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.orange,
                              ),
                            ),
                          ],
                        ),
                      ],
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Amount:',
                            style: TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '\$${totalCost.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              // SUBMIT BUTTON
              Center(
                child: isSubmitting
                    ? const CircularProgressIndicator()
                    : ElevatedButton(
                        onPressed:
                            visaType.isEmpty ? null : submitVisaApplication,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 40, vertical: 12),
                          backgroundColor: Colors.blue,
                        ),
                        child: const Text(
                          "Submit Application & Pay",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold),
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
