import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../services/bliss_communication_service.dart';
import '../models/support_ticket_model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';


class CreateTicketScreen extends StatefulWidget {
  const CreateTicketScreen({super.key});

  @override
  State<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends State<CreateTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _messageController = TextEditingController();
  final BlissCommunicationService _service = BlissCommunicationService();

  String userId = 'user123'; // Replace with actual logged-in user ID
  String role = 'candidate'; // Replace with actual logged-in user role

  bool _isSubmitting = false;

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    final ticket = SupportTicketModel(
  ticketId: '', // Firestore will assign the ID
  createdBy: userId,
  role: role,
  message: _messageController.text.trim(),
  status: 'open',
  adminResponse: '',
  createdAt: Timestamp.fromDate(DateTime.now()),
  updatedAt: Timestamp.fromDate(DateTime.now()),
    );

    try {
      await _service.createSupportTicket(ticket);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket created successfully')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create ticket: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
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
            Text("Create Support Ticket"),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _messageController,
                decoration: const InputDecoration(
                  labelText: "Describe your issue",
                  border: OutlineInputBorder(),
                ),
                validator: (val) =>
                    val == null || val.isEmpty ? "Please enter a message" : null,
                maxLines: 5,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitTicket,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(
                          color: Colors.white,
                        )
                      : const Text(
                          "Submit Ticket",
                          style: TextStyle(fontSize: 16),
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
