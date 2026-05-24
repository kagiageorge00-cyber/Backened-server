// screens/system_marketplace_screen.dart
import 'package:flutter/material.dart';
import '../models/candidate_model.dart';
import '../services/whatsapp_service.dart';
import '../widgets/candidate_card.dart';

class SystemMarketplaceScreen extends StatefulWidget {
  final List<Candidate> candidates;

  const SystemMarketplaceScreen({super.key, required this.candidates});

  @override
  _SystemMarketplaceScreenState createState() => _SystemMarketplaceScreenState();
}

class _SystemMarketplaceScreenState extends State<SystemMarketplaceScreen> {
  bool sendingBulk = false;

  @override
  Widget build(BuildContext context) {
    final eligibleCandidates = widget.candidates.where((candidate) {
      if (!candidate.feePaid) return false;
      if ((candidate.jobApplied.contains('Dubai') ||
          candidate.jobApplied.contains('Qatar') ||
          candidate.jobApplied.contains('Lebanon') ||
          candidate.jobApplied.contains('Iraq')) && !candidate.medicalBooked) {
        return false;
      }
      return candidate.jobApplied.toLowerCase().contains('housemaid');
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('System Marketplace'),
        actions: [
          sendingBulk
              ? Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircularProgressIndicator(color: Colors.white),
                )
              : IconButton(
                  icon: Icon(Icons.send),
                  tooltip: "Send Bulk WhatsApp",
                  onPressed: () async {
                    setState(() => sendingBulk = true);
                    List<Map<String, String>> messages = eligibleCandidates.map((c) {
                      return {
                        "phone": c.phone,
                        "message": "Hello ${c.fullName}, a new housemaid job is available in ${c.jobApplied}. Please apply now."
                      };
                    }).toList();

                    try {
                      await WhatsAppService.sendBulkMessages(messages);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Bulk WhatsApp messages sent!")),
                      );
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Error sending messages: $e")),
                      );
                    } finally {
                      setState(() => sendingBulk = false);
                    }
                  },
                ),
        ],
      ),
      body: ListView.builder(
        itemCount: eligibleCandidates.length,
        itemBuilder: (context, index) {
          final candidate = eligibleCandidates[index];
          return CandidateCard(
            candidate: candidate,
            onMessage: () async {
              await WhatsAppService.sendMessage(
                candidate.phone,
                "Hello ${candidate.fullName}, a new housemaid job is available in ${candidate.jobApplied}. Please apply now.",
              );
            },
            onSelect: () {
              // Sponsor selects candidate → trigger employer fee payment
            },
          );
        },
      ),
    );
  }
}
