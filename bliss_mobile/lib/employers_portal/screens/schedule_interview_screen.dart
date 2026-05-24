import 'package:flutter/material.dart';

class ScheduleInterviewScreen extends StatefulWidget {
  final String candidateName;
  final String candidateId;

  const ScheduleInterviewScreen({
    super.key,
    required this.candidateName,
    required this.candidateId,
  });

  @override
  State<ScheduleInterviewScreen> createState() =>
      _ScheduleInterviewScreenState();
}

class _ScheduleInterviewScreenState extends State<ScheduleInterviewScreen> {
  DateTime? selectedDate;
  TimeOfDay? selectedTime;
  final TextEditingController notesController = TextEditingController();

  /// ---------------------------
  /// DATE PICKER
  /// ---------------------------
  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: "Select Interview Date",
    );

    if (picked != null) {
      setState(() => selectedDate = picked);
    }
  }

  /// ---------------------------
  /// TIME PICKER
  /// ---------------------------
  Future<void> _pickTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      helpText: "Select Interview Time",
      initialTime: TimeOfDay.now(),
    );

    if (picked != null) {
      setState(() => selectedTime = picked);
    }
  }

  /// ---------------------------
  /// SUBMIT INTERVIEW SCHEDULE
  /// ---------------------------
  void _submitSchedule() {
    if (selectedDate == null || selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select date and time!")),
      );
      return;
    }

    /// TODO: Add this to interview_service.dart
    ///
    /// interviewService.scheduleInterview(
    ///   candidateId: widget.candidateId,
    ///   candidateName: widget.candidateName,
    ///   date: selectedDate!,
    ///   time: selectedTime!,
    ///   notes: notesController.text,
    /// );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        title: const Text("Interview Scheduled"),
        content: Text(
          "You have successfully scheduled an interview with ${widget.candidateName}.",
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // close dialog
              Navigator.pop(context); // return to previous page
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  /// ---------------------------
  /// WIDGET BUILDER
  /// ---------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          "Schedule Interview",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),

      /// ===========================================
      /// BODY
      /// ===========================================
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// HEADER CARD
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    blurRadius: 8,
                    color: Colors.black.withOpacity(0.05),
                  )
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.blue.shade100,
                    child: const Icon(Icons.person, size: 32, color: Colors.blue),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      widget.candidateName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                ],
              ),
            ),

            const SizedBox(height: 25),

            const Text(
              "Interview Date",
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),

            GestureDetector(
              onTap: _pickDate,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined),
                    const SizedBox(width: 12),
                    Text(
                      selectedDate == null
                          ? "Choose date"
                          : "${selectedDate!.year}-${selectedDate!.month}-${selectedDate!.day}",
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              "Interview Time",
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),

            GestureDetector(
              onTap: _pickTime,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time),
                    const SizedBox(width: 12),
                    Text(
                      selectedTime == null
                          ? "Choose time"
                          : selectedTime!.format(context),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 25),

            const Text(
              "Notes (optional)",
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: TextField(
                controller: notesController,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: "Add any instructions, interview link, or notes...",
                  border: InputBorder.none,
                ),
              ),
            ),

            const SizedBox(height: 40),

            /// SUBMIT BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitSchedule,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue.shade700,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  "Schedule Interview",
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
