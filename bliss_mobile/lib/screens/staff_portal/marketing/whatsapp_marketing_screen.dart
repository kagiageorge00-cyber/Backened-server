import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class WhatsAppMarketingScreen extends StatefulWidget {
  const WhatsAppMarketingScreen({super.key});

  @override
  State<WhatsAppMarketingScreen> createState() => _WhatsAppMarketingScreenState();
}

class _WhatsAppMarketingScreenState extends State<WhatsAppMarketingScreen> {
  final TextEditingController messageController = TextEditingController();
  bool isSending = false;

  // Sample KPI data
  final List<Map<String, String>> kpis = [
    {'title': 'Sent Messages', 'value': '1,230'},
    {'title': 'Pending Messages', 'value': '120'},
    {'title': 'Campaigns', 'value': '5'},
    {'title': 'Active Numbers', 'value': '450'},
  ];

  @override
  void dispose() {
    messageController.dispose();
    super.dispose();
  }

  void sendBulkWhatsApp() async {
    if (messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text("Please enter a message")));
      return;
    }

    setState(() => isSending = true);

    try {
      // TODO: Call your WhatsApp service here
      await Future.delayed(const Duration(seconds: 2)); // mock sending

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Bulk message sent successfully!")),
      );
      messageController.clear();
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text("Error sending messages: $e")));
    } finally {
      setState(() => isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "WhatsApp Marketing Dashboard",
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // KPI Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: kpis.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.6,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemBuilder: (context, i) {
              final item = kpis[i];
              return Card(
                color: Colors.blue.shade50,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  leading: const Icon(FontAwesomeIcons.whatsapp, color: Colors.green),
                  title: Text(
                    item['value']!,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(item['title']!),
                ),
              );
            },
          ),
          const SizedBox(height: 24),

          // Bulk WhatsApp Sender
          const Text(
            "Send Bulk WhatsApp Message",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: messageController,
            maxLines: 5,
            decoration: InputDecoration(
              hintText: "Type your message here...",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              icon: isSending
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const FaIcon(FontAwesomeIcons.paperPlane),
              label: Text(
                isSending ? "Sending..." : "Send to All Contacts",
                style: const TextStyle(fontSize: 18),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: isSending ? null : sendBulkWhatsApp,
            ),
          ),
        ],
      ),
    );
  }
}
