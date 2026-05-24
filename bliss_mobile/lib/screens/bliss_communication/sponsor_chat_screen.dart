import 'package:flutter/material.dart';

class SponsorChatScreen extends StatefulWidget {
const SponsorChatScreen({super.key});

@override
_SponsorChatScreenState createState() => _SponsorChatScreenState();
}

class _SponsorChatScreenState extends State<SponsorChatScreen> {
final TextEditingController _messageController = TextEditingController();
final List<String> _messages = []; // Placeholder for chat messages
bool _paymentVerified = false; // Control access to contacts/documents

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(
title: const Text('Sponsor Chat'),
backgroundColor: Colors.blueAccent,
actions: [
IconButton(icon: const Icon(Icons.upload_file), onPressed: _paymentVerified ? _uploadDocument : null),
IconButton(icon: const Icon(Icons.contact_page), onPressed: _paymentVerified ? _viewContacts : _showPaymentAlert),
],
),
body: Column(
children: [
Expanded(
child: ListView.builder(
reverse: true,
padding: const EdgeInsets.all(12),
itemCount: _messages.length,
itemBuilder: (context, index) {
final message = _messages[_messages.length - 1 - index];
return Align(
alignment: index % 2 == 0 ? Alignment.centerRight : Alignment.centerLeft,
child: Container(
margin: const EdgeInsets.symmetric(vertical: 4),
padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
decoration: BoxDecoration(
color: index % 2 == 0 ? Colors.blueAccent : Colors.grey[300],
borderRadius: BorderRadius.circular(12),
),
child: Text(
message,
style: TextStyle(
color: index % 2 == 0 ? Colors.white : Colors.black87,
),
),
),
);
},
),
),
Container(
padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
color: Colors.white,
child: Row(
children: [
IconButton(
icon: const Icon(Icons.attach_file),
onPressed: _paymentVerified ? _uploadDocument : _showPaymentAlert,
),
Expanded(
child: TextField(
controller: _messageController,
decoration: const InputDecoration(
hintText: "Type a message...",
border: InputBorder.none,
),
),
),
IconButton(
icon: const Icon(Icons.send),
onPressed: () {
if (_messageController.text.trim().isNotEmpty) {
setState(() {
_messages.add(_messageController.text.trim());
_messageController.clear();
});
}
},
),
],
),
),
],
),
floatingActionButton: !_paymentVerified
? FloatingActionButton.extended(
onPressed: _verifyPayment,
label: const Text("Unlock Contact Access"),
icon: const Icon(Icons.lock_open),
backgroundColor: Colors.green,
)
: null,
);
}

void _verifyPayment() {
// Placeholder for real payment verification logic
setState(() {
_paymentVerified = true;
});
ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Payment verified! You now have full access.")));
}

void _showPaymentAlert() {
ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please complete payment to access this feature.")));
}

void _uploadDocument() {
// Placeholder for document upload logic
ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Upload document function triggered.")));
}

void _viewContacts() {
// Placeholder to view candidate contacts after payment
ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Candidate contacts displayed.")));
}
}
