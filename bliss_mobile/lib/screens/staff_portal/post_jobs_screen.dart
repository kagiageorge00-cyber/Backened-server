import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
// backend-only auth (post jobs is managed by admin account)

class PostJobsScreen extends StatefulWidget {
  const PostJobsScreen({super.key});

  @override
  State<PostJobsScreen> createState() => _PostJobsScreenState();
}

class _PostJobsScreenState extends State<PostJobsScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // no FirebaseAuth in backend-only model

  final _formKey = GlobalKey<FormState>();

  // Form Controllers
  final _jobTitleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _requirementsController = TextEditingController();
  final _salaryMinController = TextEditingController();
  final _salaryMaxController = TextEditingController();
  final _locationController = TextEditingController();
  final _benefitsController = TextEditingController();
  final _deadlineController = TextEditingController();

  String _selectedJobType = 'Full-time';
  String _selectedCategory = 'IT & Technology';
  String _selectedExperience = 'Entry Level';
  bool _isPosting = false;
  List<String> _postedJobs = [];

  final List<String> _jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Remote'
  ];
  final List<String> _categories = [
    'IT & Technology',
    'Healthcare',
    'Finance',
    'Engineering',
    'Sales & Marketing',
    'Hospitality & Tourism',
    'Education',
    'Manufacturing',
    'Administrative',
    'Construction',
    'Other',
  ];
  final List<String> _experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior',
    'Executive'
  ];

  @override
  void initState() {
    super.initState();
    _loadPostedJobs();
  }

  void _loadPostedJobs() async {
    try {
      final snapshot = await _firestore
          .collection('jobs')
          .where('postedBy', isEqualTo: 'bliss_company')
          .orderBy('createdAt', descending: true)
          .limit(10)
          .get();

      setState(() {
        _postedJobs = snapshot.docs.map((doc) => doc.id).toList();
      });
    } catch (e) {
      debugPrint('Error loading posted jobs: $e');
    }
  }

  Future<void> _postJob() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isPosting = true);

    try {
      final jobData = {
        'jobTitle': _jobTitleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'requirements': _requirementsController.text.trim(),
        'salaryMin': int.tryParse(_salaryMinController.text) ?? 0,
        'salaryMax': int.tryParse(_salaryMaxController.text) ?? 0,
        'location': _locationController.text.trim(),
        'jobType': _selectedJobType,
        'category': _selectedCategory,
        'experienceLevel': _selectedExperience,
        'benefits': _benefitsController.text.trim(),
        'deadline': _deadlineController.text.trim(),
        'postedBy': 'bliss_company',
        'employerName': 'bliss connect & Travel',
        'employerLogo': 'assets/images/logo.png',
        'createdAt': Timestamp.now(),
        'updatedAt': Timestamp.now(),
        'applicants': [],
        'views': 0,
        'status': 'active',
      };

      // Post to Firestore
      final docRef = await _firestore.collection('jobs').add(jobData);

      // Also add to jobs marketplace collection
      await _firestore.collection('jobsMarketplace').doc(docRef.id).set({
        ...jobData,
        'jobId': docRef.id,
      });

      setState(() {
        _postedJobs.insert(0, docRef.id);
      });

      // Clear form
      _jobTitleController.clear();
      _descriptionController.clear();
      _requirementsController.clear();
      _salaryMinController.clear();
      _salaryMaxController.clear();
      _locationController.clear();
      _benefitsController.clear();
      _deadlineController.clear();

      _showSnackBar('Job posted successfully!', Colors.green);
    } catch (e) {
      _showSnackBar('Error posting job: $e', Colors.red);
      debugPrint('Error posting job: $e');
    } finally {
      setState(() => _isPosting = false);
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        _deadlineController.text = picked.toString().split(' ')[0];
      });
    }
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

  @override
  void dispose() {
    _jobTitleController.dispose();
    _descriptionController.dispose();
    _requirementsController.dispose();
    _salaryMinController.dispose();
    _salaryMaxController.dispose();
    _locationController.dispose();
    _benefitsController.dispose();
    _deadlineController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Post Jobs'),
          centerTitle: true,
          elevation: 0,
          backgroundColor: const Color(0xFF6366F1),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'New Job', icon: Icon(Icons.add)),
              Tab(text: 'Posted Jobs', icon: Icon(Icons.list)),
            ],
            indicatorColor: Colors.white,
          ),
        ),
        body: TabBarView(
          children: [
            _buildPostJobForm(),
            _buildPostedJobsList(),
          ],
        ),
      ),
    );
  }

  Widget _buildPostJobForm() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Job Title
              _buildFormSection(
                'Job Title',
                TextFormField(
                  controller: _jobTitleController,
                  decoration: _buildInputDecoration(
                    'Enter job title',
                    Icons.work,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a job title';
                    }
                    return null;
                  },
                ),
              ),

              // Job Type & Category
              Row(
                children: [
                  Expanded(
                    child: _buildFormSection(
                      'Job Type',
                      DropdownButtonFormField<String>(
                        initialValue: _selectedJobType,
                        decoration: _buildInputDecoration('', Icons.category),
                        items: _jobTypes
                            .map((type) => DropdownMenuItem(
                                  value: type,
                                  child: Text(type),
                                ))
                            .toList(),
                        onChanged: (value) {
                          setState(() =>
                              _selectedJobType = value ?? _selectedJobType);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildFormSection(
                      'Category',
                      DropdownButtonFormField<String>(
                        initialValue: _selectedCategory,
                        decoration: _buildInputDecoration('', Icons.business),
                        items: _categories
                            .map((cat) => DropdownMenuItem(
                                  value: cat,
                                  child: Text(cat,
                                      overflow: TextOverflow.ellipsis),
                                ))
                            .toList(),
                        onChanged: (value) {
                          setState(() =>
                              _selectedCategory = value ?? _selectedCategory);
                        },
                      ),
                    ),
                  ),
                ],
              ),

              // Experience Level
              _buildFormSection(
                'Experience Level',
                DropdownButtonFormField<String>(
                  initialValue: _selectedExperience,
                  decoration: _buildInputDecoration('', Icons.star),
                  items: _experienceLevels
                      .map((level) => DropdownMenuItem(
                            value: level,
                            child: Text(level),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() =>
                        _selectedExperience = value ?? _selectedExperience);
                  },
                ),
              ),

              // Location
              _buildFormSection(
                'Location',
                TextFormField(
                  controller: _locationController,
                  decoration: _buildInputDecoration(
                    'Enter job location',
                    Icons.location_on,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a location';
                    }
                    return null;
                  },
                ),
              ),

              // Salary Range
              Row(
                children: [
                  Expanded(
                    child: _buildFormSection(
                      'Min Salary',
                      TextFormField(
                        controller: _salaryMinController,
                        decoration:
                            _buildInputDecoration('₦0', Icons.attach_money),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildFormSection(
                      'Max Salary',
                      TextFormField(
                        controller: _salaryMaxController,
                        decoration:
                            _buildInputDecoration('₦0', Icons.attach_money),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                ],
              ),

              // Application Deadline
              _buildFormSection(
                'Application Deadline',
                TextFormField(
                  controller: _deadlineController,
                  decoration: _buildInputDecoration(
                    'Select deadline',
                    Icons.calendar_today,
                  ),
                  readOnly: true,
                  onTap: () => _selectDate(context),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please select a deadline';
                    }
                    return null;
                  },
                ),
              ),

              // Job Description
              _buildFormSection(
                'Job Description',
                TextFormField(
                  controller: _descriptionController,
                  decoration: _buildInputDecoration(
                    'Enter detailed job description',
                    Icons.description,
                  ),
                  maxLines: 5,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a job description';
                    }
                    return null;
                  },
                ),
              ),

              // Requirements
              _buildFormSection(
                'Requirements',
                TextFormField(
                  controller: _requirementsController,
                  decoration: _buildInputDecoration(
                    'Enter job requirements (one per line)',
                    Icons.checklist,
                  ),
                  maxLines: 4,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter job requirements';
                    }
                    return null;
                  },
                ),
              ),

              // Benefits
              _buildFormSection(
                'Benefits',
                TextFormField(
                  controller: _benefitsController,
                  decoration: _buildInputDecoration(
                    'Enter job benefits (one per line)',
                    Icons.card_giftcard,
                  ),
                  maxLines: 4,
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isPosting ? null : _postJob,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    disabledBackgroundColor: Colors.grey[400],
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isPosting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                            strokeWidth: 2,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.upload, color: Colors.white),
                            SizedBox(width: 8),
                            Text(
                              'Post Job to Marketplace',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPostedJobsList() {
    return _postedJobs.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.work_outline,
                  size: 56,
                  color: Colors.grey[300],
                ),
                const SizedBox(height: 12),
                Text(
                  'No jobs posted yet',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          )
        : StreamBuilder<QuerySnapshot>(
            stream: _firestore
                .collection('jobs')
                .where('postedBy', isEqualTo: 'bliss_company')
                .orderBy('createdAt', descending: true)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return Center(
                  child: Text('Error: ${snapshot.error}'),
                );
              }

              if (!snapshot.hasData) {
                return const Center(
                  child: CircularProgressIndicator(),
                );
              }

              final jobs = snapshot.data!.docs;

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: jobs.length,
                itemBuilder: (context, index) {
                  final job = jobs[index];
                  final data = job.data() as Map<String, dynamic>;

                  return _buildJobCard(job.id, data);
                },
              );
            },
          );
  }

  Widget _buildJobCard(String jobId, Map<String, dynamic> data) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            data['jobTitle'] ?? 'N/A',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            data['employerName'] ?? 'Bliss',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        data['status'] ?? 'active',
                        style: const TextStyle(
                          color: Color(0xFF6366F1),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      data['location'] ?? 'N/A',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.work, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      data['jobType'] ?? 'N/A',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.star, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      data['experienceLevel'] ?? 'N/A',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (data['salaryMin'] != null && data['salaryMax'] != null)
                  Text(
                    '₦${data['salaryMin']} - ₦${data['salaryMax']}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF10B981),
                    ),
                  ),
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey[200]),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.person, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${(data['applicants'] as List?)?.length ?? 0} Applicants',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Icon(Icons.visibility, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${data['views'] ?? 0} Views',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    _showSnackBar('Edit feature coming soon', Colors.blue);
                  },
                  icon: const Icon(Icons.edit, size: 14),
                  label: const Text('Edit'),
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
          ),
        ],
      ),
    );
  }

  Widget _buildFormSection(String label, Widget field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 8),
          field,
        ],
      ),
    );
  }

  InputDecoration _buildInputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        color: Theme.of(context).brightness == Brightness.dark
            ? Colors.white70
            : Colors.grey[500],
      ),
      prefixIcon: Icon(icon, color: const Color(0xFF6366F1)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: Color(0xFF6366F1),
          width: 2,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}
