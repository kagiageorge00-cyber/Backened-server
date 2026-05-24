import 'package:flutter/material.dart';

class CompanyDocumentsScreen extends StatefulWidget {
  const CompanyDocumentsScreen({super.key});

  @override
  State<CompanyDocumentsScreen> createState() => _CompanyDocumentsScreenState();
}

class _CompanyDocumentsScreenState extends State<CompanyDocumentsScreen> {
  final List<Map<String, dynamic>> _documents = [];

  Future<void> _uploadDocument() async {
    // Implement file picker here
    // For simulation:
    setState(() {
      _documents.add({
        'name': 'Document ${_documents.length + 1}',
        'uploadedAt': DateTime.now(),
      });
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Document uploaded successfully')),
    );
  }

  void _deleteDocument(int index) {
    setState(() {
      _documents.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Document deleted successfully')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        title: const Text(
          "Company Documents",
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            ElevatedButton.icon(
              onPressed: _uploadDocument,
              icon: const Icon(Icons.upload_file),
              label: const Text("Upload Document"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade700,
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _documents.isEmpty
                  ? const Center(
                      child: Text(
                        "No documents uploaded yet",
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _documents.length,
                      itemBuilder: (context, index) {
                        final doc = _documents[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            title: Text(doc['name']),
                            subtitle: Text(
                              "Uploaded at: ${doc['uploadedAt'].toString().substring(0, 16)}",
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteDocument(index),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
