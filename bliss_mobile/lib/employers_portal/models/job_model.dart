class Job {
  final String id;
  final String employerId;
  final String title;
  final String description;

  Job({
    required this.id,
    required this.employerId,
    required this.title,
    this.description = '',
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employerId': employerId,
      'title': title,
      'description': description,
    };
  }

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id']?.toString() ?? '',
      employerId: json['employerId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
    );
  }
}
