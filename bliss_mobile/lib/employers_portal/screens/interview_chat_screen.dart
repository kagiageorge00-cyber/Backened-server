import 'package:flutter/material.dart';
import 'package:bliss_mobile/firebase_stub.dart';
import 'package:intl/intl.dart';

class InterviewChatScreen extends StatefulWidget {
  final String interviewId;
  final String employerId;
  final String employerName;

  const InterviewChatScreen({
    super.key,
    required this.interviewId,
    required this.employerId,
    required this.employerName,
  });

  @override
  _InterviewChatScreenState createState() => _InterviewChatScreenState();
}

class _InterviewChatScreenState extends State<InterviewChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final CollectionReference _messagesCollection =
      FirebaseFirestore.instance.collection("interview_chats");

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    await _messagesCollection
        .doc(widget.interviewId)
        .collection("messages")
        .add({
      "senderId": widget.employerId,
      "senderName": widget.employerName,
      "message": text,
      "timestamp": FieldValue.serverTimestamp(),
    });

    _messageController.clear();
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent + 70,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  String _formatTimestamp(Timestamp? timestamp) {
    if (timestamp == null) return "";
    final date = timestamp.toDate();
    return DateFormat('MMM d, hh:mm a').format(date);
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          "Interview Chat",
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: _messagesCollection
                  .doc(widget.interviewId)
                  .collection("messages")
                  .orderBy("timestamp", descending: false)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text("Error loading messages"));
                }
                if (!snapshot.hasData) {
                  return Center(child: CircularProgressIndicator());
                }

                final docs = snapshot.data!.docs;

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final data = docs[index].data();
                    final isEmployer =
                        data["senderId"] == widget.employerId;
                    final message = data["message"] ?? "";
                    final timestamp = data["timestamp"] as Timestamp?;

                    return Align(
                      alignment: isEmployer
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 14),
                        constraints: BoxConstraints(maxWidth: 250),
                        decoration: BoxDecoration(
                          color: isEmployer
                              ? Colors.blue.shade700
                              : Colors.grey.shade300,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(12),
                            topRight: Radius.circular(12),
                            bottomLeft: Radius.circular(
                                isEmployer ? 12 : 0),
                            bottomRight: Radius.circular(
                                isEmployer ? 0 : 12),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: isEmployer
                              ? CrossAxisAlignment.end
                              : CrossAxisAlignment.start,
                          children: [
                            Text(
                              message,
                              style: TextStyle(
                                color: isEmployer
                                    ? Colors.white
                                    : Colors.black87,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              _formatTimestamp(timestamp),
                              style: TextStyle(
                                fontSize: 10,
                                color: isEmployer
                                    ? Colors.white70
                                    : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),

          // Input field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 4,
                  offset: Offset(0, -2),
                )
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: "Type your message...",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      fillColor: Colors.grey.shade200,
                      filled: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                    ),
                  ),
                ),
                SizedBox(width: 8),
                GestureDetector(
                  onTap: _sendMessage,
                  child: CircleAvatar(
                    backgroundColor: Colors.blue.shade700,
                    radius: 22,
                    child: Icon(Icons.send, color: Colors.white),
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
