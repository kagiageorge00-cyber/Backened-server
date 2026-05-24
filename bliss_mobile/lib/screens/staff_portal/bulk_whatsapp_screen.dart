import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';

class BulkWhatsAppScreen extends StatefulWidget {
  const BulkWhatsAppScreen({super.key});

  @override
  State<BulkWhatsAppScreen> createState() => _BulkWhatsAppScreenState();
}

class _BulkWhatsAppScreenState extends State<BulkWhatsAppScreen> {
  // WhatsApp Cloud API credentials - Update these with your actual credentials
  static const String _accessToken =
      'YOUR_WHATSAPP_ACCESS_TOKEN'; // Get from Meta Business Suite
  static const String _phoneNumberId =
      'YOUR_PHONE_NUMBER_ID'; // Get from Meta Business Suite

  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _recipientListController =
      TextEditingController();

  final List<String> _recipients = [];
  final List<Map<String, dynamic>> _sendingResults = [];
  bool _isSending = false;
  int _sentCount = 0;
  int _failedCount = 0;
  double _progress = 0.0;

  // Template messages
  final List<String> _templates = [
    'Hello {name}, this is a message from bliss connect.',
    'Dear {name}, thank you for your interest in our services.',
    'Hi {name}, we have an exciting opportunity for you!',
    'Welcome {name}! We\'re excited to have you on board.',
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _recipientListController.dispose();
    super.dispose();
  }

  Future<void> _pickCSVFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv', 'txt'],
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        // Parse CSV/TXT file and extract phone numbers
        _showSnackBar('File selected: ${file.name}', Colors.green);
      }
    } catch (e) {
      _showSnackBar('Error picking file: $e', Colors.red);
    }
  }

  void _addRecipient(String phoneNumber) {
    if (phoneNumber.isEmpty) {
      _showSnackBar('Please enter a phone number', Colors.orange);
      return;
    }

    // Validate phone number format
    if (!_isValidPhoneNumber(phoneNumber)) {
      _showSnackBar('Invalid phone number format', Colors.red);
      return;
    }

    setState(() {
      if (!_recipients.contains(phoneNumber)) {
        _recipients.add(phoneNumber);
        _recipientListController.clear();
      } else {
        _showSnackBar('Phone number already added', Colors.orange);
      }
    });
  }

  void _removeRecipient(int index) {
    setState(() {
      _recipients.removeAt(index);
    });
  }

  bool _isValidPhoneNumber(String phoneNumber) {
    // Basic validation - adjust regex based on your requirements
    final regex = RegExp(r'^\+?[1-9]\d{1,14}$');
    return regex.hasMatch(phoneNumber.replaceAll(RegExp(r'\D'), ''));
  }

  Future<void> _sendBulkMessages() async {
    if (_recipients.isEmpty) {
      _showSnackBar('Please add at least one recipient', Colors.orange);
      return;
    }

    if (_messageController.text.isEmpty) {
      _showSnackBar('Please enter a message', Colors.orange);
      return;
    }

    setState(() {
      _isSending = true;
      _sentCount = 0;
      _failedCount = 0;
      _sendingResults.clear();
      _progress = 0.0;
    });

    final message = _messageController.text;
    final totalRecipients = _recipients.length;

    for (int i = 0; i < totalRecipients; i++) {
      final recipient = _recipients[i];

      try {
        final response = await http.post(
          Uri.parse(
            'https://graph.instagram.com/v18.0/$_phoneNumberId/messages',
          ),
          headers: {
            'Authorization': 'Bearer $_accessToken',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'messaging_product': 'whatsapp',
            'to': recipient,
            'type': 'text',
            'text': {
              'body': message,
            },
          }),
        );

        if (response.statusCode == 200) {
          final responseData = jsonDecode(response.body);
          setState(() {
            _sentCount++;
            _sendingResults.add({
              'recipient': recipient,
              'status': 'sent',
              'messageId': responseData['messages'][0]['id'],
              'timestamp': DateTime.now(),
            });
          });
        } else {
          final errorData = jsonDecode(response.body);
          setState(() {
            _failedCount++;
            _sendingResults.add({
              'recipient': recipient,
              'status': 'failed',
              'error': errorData['error']['message'] ?? 'Unknown error',
              'timestamp': DateTime.now(),
            });
          });
        }
      } catch (e) {
        setState(() {
          _failedCount++;
          _sendingResults.add({
            'recipient': recipient,
            'status': 'failed',
            'error': e.toString(),
            'timestamp': DateTime.now(),
          });
        });
      }

      // Update progress
      setState(() {
        _progress = (i + 1) / totalRecipients;
      });

      // Add delay between requests to avoid rate limiting
      await Future.delayed(const Duration(milliseconds: 500));
    }

    setState(() {
      _isSending = false;
    });

    _showSnackBar(
      'Bulk sending complete! Sent: $_sentCount, Failed: $_failedCount',
      _failedCount == 0 ? Colors.green : Colors.orange,
    );
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _exportResults() async {
    if (_sendingResults.isEmpty) {
      _showSnackBar('No results to export', Colors.orange);
      return;
    }

    final csv = _generateCSV();
    await Clipboard.setData(ClipboardData(text: csv));
    _showSnackBar('Results copied to clipboard', Colors.green);
  }

  String _generateCSV() {
    StringBuffer csv = StringBuffer();
    csv.writeln('Recipient,Status,Message ID/Error,Timestamp');

    for (var result in _sendingResults) {
      final recipient = result['recipient'];
      final status = result['status'];
      final detail = result['messageId'] ?? result['error'] ?? '';
      final timestamp = result['timestamp'].toString();

      csv.writeln('$recipient,$status,"$detail",$timestamp');
    }

    return csv.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Bulk WhatsApp Messages'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        foregroundColor: Theme.of(context).appBarTheme.foregroundColor,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // API Configuration Section
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.settings, color: Colors.green.shade600),
                      const SizedBox(width: 8),
                      Text(
                        'WhatsApp API Configuration',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).textTheme.bodyLarge?.color,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Business Phone: +254 102084855',
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'To use this feature, update the credentials in the code with your WhatsApp Cloud API access token and phone number ID from Meta Business Suite.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
                  ),
                ],
              ),
            ),
            // Stats Header
            if (_sendingResults.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF25D366),
                      const Color(0xFF128C7E),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatTile('Total', _sendingResults.length.toString(),
                        Colors.white),
                    _buildStatTile(
                        'Sent', _sentCount.toString(), Colors.greenAccent),
                    _buildStatTile(
                        'Failed', _failedCount.toString(), Colors.redAccent),
                  ],
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Message Section
                  _buildSectionHeader('Message'),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: 'Enter your bulk message...',
                        hintStyle: TextStyle(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white70
                              : Colors.grey[500],
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(12),
                        prefixIcon:
                            const Icon(Icons.message, color: Color(0xFF25D366)),
                      ),
                      maxLines: 5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildTemplateButtons(),

                  const SizedBox(height: 24),

                  // Recipients Section
                  _buildSectionHeader('Recipients (${_recipients.length})'),
                  const SizedBox(height: 12),

                  // Add Recipient Row
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey[300]!),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextField(
                            controller: _recipientListController,
                            decoration: InputDecoration(
                              hintText: 'Enter phone number (+234...)',
                              hintStyle: TextStyle(
                                color: Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? Colors.white70
                                    : Colors.grey[500],
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.all(12),
                              prefixIcon: const Icon(Icons.phone,
                                  color: Color(0xFF25D366)),
                            ),
                            keyboardType: TextInputType.phone,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () =>
                            _addRecipient(_recipientListController.text),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Icon(Icons.add, color: Colors.white),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Recipients List
                  if (_recipients.isNotEmpty)
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      constraints: const BoxConstraints(maxHeight: 200),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _recipients.length,
                        itemBuilder: (context, index) {
                          return ListTile(
                            leading: const Icon(Icons.check_circle,
                                color: Color(0xFF25D366)),
                            title: Text(_recipients[index]),
                            trailing: IconButton(
                              icon: const Icon(Icons.close, color: Colors.red),
                              onPressed: () => _removeRecipient(index),
                            ),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 16),

                  // File Upload
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _pickCSVFile,
                          icon: const Icon(Icons.upload_file),
                          label: const Text('Upload CSV/TXT'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            setState(() => _recipients.clear());
                            _showSnackBar('Recipients cleared', Colors.orange);
                          },
                          icon: const Icon(Icons.delete),
                          label: const Text('Clear All'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Progress Bar
                  if (_isSending)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Sending Progress',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            Text(
                              '${(_progress * 100).toStringAsFixed(0)}%',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF25D366),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: LinearProgressIndicator(
                            value: _progress,
                            minHeight: 8,
                            backgroundColor: Colors.grey[300],
                            valueColor: const AlwaysStoppedAnimation(
                              Color(0xFF25D366),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Center(
                          child: Text(
                            'Sent: $_sentCount, Failed: $_failedCount',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),

                  // Send Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSending ? null : _sendBulkMessages,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        disabledBackgroundColor: Colors.grey[400],
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSending
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                valueColor:
                                    AlwaysStoppedAnimation(Colors.white),
                                strokeWidth: 2,
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.send, color: Colors.white),
                                const SizedBox(width: 8),
                                Text(
                                  'Send to ${_recipients.length} Recipients',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),

                  // Results Section
                  if (_sendingResults.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSectionHeader('Results'),
                        ElevatedButton.icon(
                          onPressed: _exportResults,
                          icon: const Icon(Icons.download, size: 16),
                          label: const Text('Export'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _sendingResults.length,
                      itemBuilder: (context, index) {
                        final result = _sendingResults[index];
                        return _buildResultTile(result);
                      },
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1F2937),
      ),
    );
  }

  Widget _buildTemplateButtons() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _templates.map((template) {
        return ActionChip(
          label: Text(
            '${template.split(' ').take(3).join(' ')}...',
            style: const TextStyle(fontSize: 12),
          ),
          onPressed: () {
            setState(() {
              _messageController.text = template;
            });
          },
          backgroundColor: const Color(0xFF25D366).withOpacity(0.1),
          labelStyle: const TextStyle(color: Color(0xFF25D366)),
        );
      }).toList(),
    );
  }

  Widget _buildStatTile(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildResultTile(Map<String, dynamic> result) {
    final isSuccess = result['status'] == 'sent';
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSuccess
              ? Colors.green.withOpacity(0.05)
              : Colors.red.withOpacity(0.05),
          border: Border.all(
            color: isSuccess ? Colors.green : Colors.red,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              isSuccess ? Icons.check_circle : Icons.error,
              color: isSuccess ? Colors.green : Colors.red,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    result['recipient'],
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isSuccess
                        ? 'Message ID: ${result['messageId']}'
                        : 'Error: ${result['error']}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Text(
              isSuccess ? 'Sent' : 'Failed',
              style: TextStyle(
                color: isSuccess ? Colors.green : Colors.red,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
