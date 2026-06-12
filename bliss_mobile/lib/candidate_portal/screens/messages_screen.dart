import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/candidate_service.dart';

class MessagesScreen extends StatefulWidget {
  final ApiClient api;
  const MessagesScreen({super.key, required this.api});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  late final CandidateService _service;
  late Future<List<Map<String, dynamic>>> _conversations;
  final TextEditingController _messageController = TextEditingController();
  Map<String, dynamic>? _selectedConversation;

  @override
  void initState() {
    super.initState();
    _service = CandidateService(widget.api);
    _conversations = _service.getConversations();
  }

  Future<void> _refresh() async {
    setState(() {
      _conversations = _service.getConversations();
    });
    await _conversations;
  }

  Future<void> _sendMessage() async {
    if (_selectedConversation == null ||
        _messageController.text.trim().isEmpty) {
      return;
    }
    final res = await _service.sendMessage(
      _selectedConversation!['_id']?.toString() ?? '',
      _messageController.text.trim(),
    );
    if (!mounted) return;
    if (res['success'] == true) {
      _messageController.clear();
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Message sent')));
      await _refresh();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Send failed: ${res['error'] ?? 'unknown'}')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: FutureBuilder<List<Map<String, dynamic>>>(
            future: _conversations,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text('Error: ${snapshot.error}'));
              }
              final convos = snapshot.data ?? [];
              if (convos.isEmpty) {
                return const Center(child: Text('No conversations found.'));
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: convos.length,
                itemBuilder: (context, index) {
                  final conv = convos[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      title: Text(conv['name']?.toString() ?? 'Conversation'),
                      subtitle: Text(
                          conv['lastMessage']?.toString() ?? 'Tap to open'),
                      selected: _selectedConversation?['_id'] == conv['_id'],
                      onTap: () => setState(() {
                        _selectedConversation = conv;
                      }),
                    ),
                  );
                },
              );
            },
          ),
        ),
        Expanded(
          flex: 3,
          child: _selectedConversation == null
              ? const Center(child: Text('Select a conversation to message'))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _selectedConversation!['name']?.toString() ??
                            'Conversation',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(_selectedConversation!['lastMessage']
                                    ?.toString() ??
                                'No messages yet.'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _messageController,
                        decoration:
                            const InputDecoration(labelText: 'Type a message'),
                        minLines: 1,
                        maxLines: 4,
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                          onPressed: _sendMessage, child: const Text('Send')),
                    ],
                  ),
                ),
        )
      ],
    );
  }
}
