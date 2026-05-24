import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class InterviewListScreen extends StatelessWidget {
  final String employerId;

  const InterviewListScreen({
    super.key,
    required this.employerId,
  });

  String formatDate(Timestamp timestamp) {
    final date = timestamp.toDate();
    return DateFormat('EEE, MMM d • hh:mm a').format(date);
  }

  Color statusColor(String status) {
    switch (status) {
      case "Scheduled":
        return Colors.blue;
      case "Completed":
        return Colors.green;
      case "Cancelled":
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text(
          "Interviews",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: Colors.black87,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
        elevation: 1,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection("interviews")
            .where("employerId", isEqualTo: employerId)
            .orderBy("scheduledTime", descending: false)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text("Error loading interviews"));
          }
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }

          final docs = snapshot.data!.docs;

          if (docs.isEmpty) {
            return Center(
              child: Text(
                "No interviews yet",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;

              final String candidateName = data['candidateName'] ?? "Unknown";
              final String jobTitle = data['jobTitle'] ?? "Unknown Job";
              final String status = data['status'] ?? "Scheduled";
              final Timestamp? time = data['scheduledTime'];

              return GestureDetector(
                onTap: () {
                  Navigator.pushNamed(
                    context,
                    "/interview_details",
                    arguments: {"interviewId": docs[index].id},
                  );
                },
                child: Container(
                  margin: EdgeInsets.only(bottom: 16),
                  padding: EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Candidate Name + Status
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            candidateName,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue.shade900,
                            ),
                          ),
                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: statusColor(status).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              status,
                              style: TextStyle(
                                color: statusColor(status),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: 6),

                      // Job Title
                      Text(
                        jobTitle,
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.grey.shade700,
                        ),
                      ),

                      SizedBox(height: 12),

                      // Date + Time
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 20,
                            color: Colors.blue.shade700,
                          ),
                          SizedBox(width: 8),
                          Text(
                            time != null ? formatDate(time) : "No time set",
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.grey.shade800,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
