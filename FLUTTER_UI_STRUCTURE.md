# Flutter Admin UI Structure for WhatsApp Campaign Management

## Project Setup

```bash
flutter create bliss_admin
cd bliss_admin
flutter pub add http dio provider intl charts flutter_spinkit
```

### pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  dio: ^5.3.0
  provider: ^6.0.0
  intl: ^0.19.0
  fl_chart: ^0.65.0
  flutter_spinkit: ^5.2.0
  image_picker: ^1.0.0
  file_picker: ^6.0.0
  csv: ^5.0.0
  cached_network_image: ^3.3.0
  uuid: ^4.0.0
  connectivity_plus: ^5.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
```

## Directory Structure

```
lib/
├── main.dart
├── config/
│  ├── app_config.dart
│  ├── api_client.dart
│  └── constants.dart
├── models/
│  ├── contact_model.dart
│  ├── campaign_model.dart
│  ├── queue_model.dart
│  └── statistics_model.dart
├── providers/
│  ├── contact_provider.dart
│  ├── campaign_provider.dart
│  └── dashboard_provider.dart
├── screens/
│  ├── dashboard/
│  │  ├── dashboard_screen.dart
│  │  ├── widgets/
│  │  │  ├── stats_card.dart
│  │  │  ├── campaign_overview.dart
│  │  │  └── queue_status.dart
│  ├── contacts/
│  │  ├── contact_list_screen.dart
│  │  ├── contact_import_screen.dart
│  │  ├── contact_detail_screen.dart
│  │  └── widgets/
│  │     ├── contact_card.dart
│  │     ├── import_preview.dart
│  │     └── bulk_actions.dart
│  ├── campaigns/
│  │  ├── campaign_list_screen.dart
│  │  ├── campaign_builder_screen.dart
│  │  ├── campaign_detail_screen.dart
│  │  ├── campaign_statistics_screen.dart
│  │  └── widgets/
│  │     ├── campaign_card.dart
│  │     ├── message_preview.dart
│  │     ├── audience_selector.dart
│  │     ├── schedule_picker.dart
│  │     └── statistics_chart.dart
│  ├── settings/
│  │  ├── whatsapp_settings_screen.dart
│  │  └── widgets/
│  │     └── account_info_card.dart
│  └── common/
│     ├── app_drawer.dart
│     └── loading_indicator.dart
├── services/
│  ├── api_service.dart
│  ├── contact_service.dart
│  ├── campaign_service.dart
│  └── storage_service.dart
├── utils/
│  ├── validators.dart
│  ├── formatters.dart
│  └── helpers.dart
└── theme/
   ├── app_theme.dart
   └── colors.dart
```

## Core Files Implementation

### 1. API Configuration

```dart
// lib/config/api_client.dart

class ApiClient {
  static const String baseUrl = 'https://api.blissconnect.com';
  static const String whatsappEndpoint = '/api/admin/whatsapp';
  
  final Dio _dio;
  final String? _token;
  
  ApiClient({String? token}) 
    : _token = token,
      _dio = Dio(BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: Duration(seconds: 30),
        receiveTimeout: Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ));
  
  // Contact Endpoints
  Future<Response> importContacts(String filePath, List<String> tags) async {
    FormData formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      'tags': tags,
    });
    
    return await _dio.post('$whatsappEndpoint/contacts/import', data: formData);
  }
  
  Future<Response> getContacts({
    int page = 1,
    int limit = 20,
    bool? optedOut,
    List<String>? tags,
    String? search,
  }) {
    return _dio.get('$whatsappEndpoint/contacts', queryParameters: {
      'page': page,
      'limit': limit,
      if (optedOut != null) 'optedOut': optedOut,
      if (tags != null) 'tags': tags.join(','),
      if (search != null) 'search': search,
    });
  }
  
  Future<Response> getContactStatistics() =>
    _dio.get('$whatsappEndpoint/contacts/statistics');
  
  Future<Response> deduplicateContacts() =>
    _dio.post('$whatsappEndpoint/contacts/deduplicate');
  
  Future<Response> addTagsToContacts(
    List<String> contactIds,
    List<String> tags,
  ) =>
    _dio.post(
      '$whatsappEndpoint/contacts/add-tags',
      data: {'contactIds': contactIds, 'tags': tags},
    );
  
  // Campaign Endpoints
  Future<Response> createCampaign({
    required String name,
    required String message,
    String? templateName,
    List<String>? templateParameters,
    List<String>? audienceTags,
    String sendMode = 'immediate',
    DateTime? scheduledAt,
  }) =>
    _dio.post(
      '$whatsappEndpoint/campaigns',
      data: {
        'name': name,
        'message': message,
        'templateName': templateName,
        'templateParameters': templateParameters,
        'audienceTags': audienceTags,
        'sendMode': sendMode,
        'scheduledAt': scheduledAt?.toIso8601String(),
      },
    );
  
  Future<Response> getCampaigns({
    int page = 1,
    int limit = 10,
    String? status,
  }) =>
    _dio.get(
      '$whatsappEndpoint/campaigns',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
      },
    );
  
  Future<Response> getCampaignById(String campaignId) =>
    _dio.get('$whatsappEndpoint/campaigns/$campaignId');
  
  Future<Response> updateCampaign(String campaignId, Map<String, dynamic> data) =>
    _dio.patch('$whatsappEndpoint/campaigns/$campaignId', data: data);
  
  Future<Response> queueCampaign(String campaignId) =>
    _dio.post('$whatsappEndpoint/campaigns/$campaignId/queue');
  
  Future<Response> launchCampaign(String campaignId) =>
    _dio.post('$whatsappEndpoint/campaigns/$campaignId/launch');
  
  Future<Response> pauseCampaign(String campaignId) =>
    _dio.post('$whatsappEndpoint/campaigns/$campaignId/pause');
  
  Future<Response> resumeCampaign(String campaignId) =>
    _dio.post('$whatsappEndpoint/campaigns/$campaignId/resume');
  
  Future<Response> deleteCampaign(String campaignId) =>
    _dio.delete('$whatsappEndpoint/campaigns/$campaignId');
  
  Future<Response> getCampaignStatistics(String campaignId) =>
    _dio.get('$whatsappEndpoint/campaigns/$campaignId/statistics');
  
  // Dashboard
  Future<Response> getDashboardStatistics() =>
    _dio.get('$whatsappEndpoint/statistics/dashboard');
}
```

### 2. Data Models

```dart
// lib/models/contact_model.dart

class Contact {
  final String id;
  final String fullName;
  final String phoneNumber;
  final String source;
  final List<String> tags;
  final bool optedIn;
  final bool optedOut;
  final DateTime? lastMessageSentAt;
  final DateTime createdAt;
  
  Contact({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.source,
    required this.tags,
    required this.optedIn,
    required this.optedOut,
    this.lastMessageSentAt,
    required this.createdAt,
  });
  
  factory Contact.fromJson(Map<String, dynamic> json) => Contact(
    id: json['_id'],
    fullName: json['fullName'] ?? '',
    phoneNumber: json['phoneNumber'],
    source: json['source'] ?? 'manual',
    tags: List<String>.from(json['tags'] ?? []),
    optedIn: json['optedIn'] ?? true,
    optedOut: json['optedOut'] ?? false,
    lastMessageSentAt: json['lastMessageSentAt'] != null 
      ? DateTime.parse(json['lastMessageSentAt'])
      : null,
    createdAt: DateTime.parse(json['createdAt']),
  );
}

// lib/models/campaign_model.dart

class Campaign {
  final String id;
  final String name;
  final String message;
  final String? templateName;
  final List<String> audienceTags;
  final String sendMode;
  final DateTime? scheduledAt;
  final String status;
  final CampaignStats stats;
  final DateTime createdAt;
  
  Campaign({
    required this.id,
    required this.name,
    required this.message,
    this.templateName,
    required this.audienceTags,
    required this.sendMode,
    this.scheduledAt,
    required this.status,
    required this.stats,
    required this.createdAt,
  });
  
  factory Campaign.fromJson(Map<String, dynamic> json) => Campaign(
    id: json['_id'],
    name: json['name'],
    message: json['message'],
    templateName: json['templateName'],
    audienceTags: List<String>.from(json['audienceTags'] ?? []),
    sendMode: json['sendMode'] ?? 'immediate',
    scheduledAt: json['scheduledAt'] != null 
      ? DateTime.parse(json['scheduledAt']) 
      : null,
    status: json['status'],
    stats: CampaignStats.fromJson(json['stats'] ?? {}),
    createdAt: DateTime.parse(json['createdAt']),
  );
}

class CampaignStats {
  final int queued;
  final int sent;
  final int delivered;
  final int read;
  final int failed;
  final int skipped;
  
  CampaignStats({
    required this.queued,
    required this.sent,
    required this.delivered,
    required this.read,
    required this.failed,
    required this.skipped,
  });
  
  factory CampaignStats.fromJson(Map<String, dynamic> json) => CampaignStats(
    queued: json['queued'] ?? 0,
    sent: json['sent'] ?? 0,
    delivered: json['delivered'] ?? 0,
    read: json['read'] ?? 0,
    failed: json['failed'] ?? 0,
    skipped: json['skipped'] ?? 0,
  );
  
  int get total => queued + sent + delivered + read + failed + skipped;
  double get deliveryRate => total > 0 ? (delivered / total) * 100 : 0;
}

// lib/models/statistics_model.dart

class DashboardStatistics {
  final CampaignOverview campaigns;
  final QueueOverview queue;
  final DeliveryMetrics metrics;
  
  DashboardStatistics({
    required this.campaigns,
    required this.queue,
    required this.metrics,
  });
  
  factory DashboardStatistics.fromJson(Map<String, dynamic> json) => DashboardStatistics(
    campaigns: CampaignOverview.fromJson(json['campaigns'] ?? {}),
    queue: QueueOverview.fromJson(json['queue'] ?? {}),
    metrics: DeliveryMetrics.fromJson(json['deliveryMetrics'] ?? {}),
  );
}

class CampaignOverview {
  final int total;
  final int active;
  final int completed;
  
  CampaignOverview({
    required this.total,
    required this.active,
    required this.completed,
  });
  
  factory CampaignOverview.fromJson(Map<String, dynamic> json) => CampaignOverview(
    total: json['total'] ?? 0,
    active: json['active'] ?? 0,
    completed: json['completed'] ?? 0,
  );
}

class QueueOverview {
  final int pending;
  final int processing;
  final int sent;
  final int delivered;
  final int read;
  final int failed;
  
  QueueOverview({
    required this.pending,
    required this.processing,
    required this.sent,
    required this.delivered,
    required this.read,
    required this.failed,
  });
  
  factory QueueOverview.fromJson(Map<String, dynamic> json) => QueueOverview(
    pending: json['pending'] ?? 0,
    processing: json['processing'] ?? 0,
    sent: json['sent'] ?? 0,
    delivered: json['delivered'] ?? 0,
    read: json['read'] ?? 0,
    failed: json['failed'] ?? 0,
  );
}

class DeliveryMetrics {
  final int totalQueued;
  final int totalSent;
  final int totalDelivered;
  final int totalRead;
  final int totalFailed;
  
  DeliveryMetrics({
    required this.totalQueued,
    required this.totalSent,
    required this.totalDelivered,
    required this.totalRead,
    required this.totalFailed,
  });
  
  factory DeliveryMetrics.fromJson(Map<String, dynamic> json) => DeliveryMetrics(
    totalQueued: json['totalQueued'] ?? 0,
    totalSent: json['totalSent'] ?? 0,
    totalDelivered: json['totalDelivered'] ?? 0,
    totalRead: json['totalRead'] ?? 0,
    totalFailed: json['totalFailed'] ?? 0,
  );
  
  double get deliveryRate => totalSent > 0 
    ? (totalDelivered / totalSent) * 100 
    : 0;
  
  double get readRate => totalDelivered > 0 
    ? (totalRead / totalDelivered) * 100 
    : 0;
}
```

### 3. Provider (State Management)

```dart
// lib/providers/campaign_provider.dart

import 'package:flutter/material.dart';
import '../models/campaign_model.dart';
import '../services/campaign_service.dart';

class CampaignProvider with ChangeNotifier {
  final CampaignService _service;
  
  List<Campaign> _campaigns = [];
  Campaign? _selectedCampaign;
  bool _isLoading = false;
  String? _error;
  
  CampaignProvider(this._service);
  
  // Getters
  List<Campaign> get campaigns => _campaigns;
  Campaign? get selectedCampaign => _selectedCampaign;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Methods
  Future<void> fetchCampaigns({int page = 1, String? status}) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _campaigns = await _service.getCampaigns(page: page, status: status);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> createCampaign({
    required String name,
    required String message,
    List<String>? audienceTags,
    String sendMode = 'immediate',
    DateTime? scheduledAt,
  }) async {
    try {
      await _service.createCampaign(
        name: name,
        message: message,
        audienceTags: audienceTags,
        sendMode: sendMode,
        scheduledAt: scheduledAt,
      );
      await fetchCampaigns();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> launchCampaign(String campaignId) async {
    try {
      await _service.launchCampaign(campaignId);
      await fetchCampaigns();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> pauseCampaign(String campaignId) async {
    try {
      await _service.pauseCampaign(campaignId);
      await fetchCampaigns();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> deleteCampaign(String campaignId) async {
    try {
      await _service.deleteCampaign(campaignId);
      await fetchCampaigns();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
}
```

### 4. Screen Examples

```dart
// lib/screens/dashboard/dashboard_screen.dart

class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }
  
  void _loadDashboard() {
    context.read<DashboardProvider>().fetchStatistics();
    context.read<CampaignProvider>().fetchCampaigns();
    context.read<ContactProvider>().fetchContactStatistics();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('WhatsApp Campaigns'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadDashboard,
          ),
        ],
      ),
      drawer: AppDrawer(),
      body: Consumer<DashboardProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return Center(child: LoadingIndicator());
          }
          
          if (provider.error != null) {
            return Center(child: Text('Error: ${provider.error}'));
          }
          
          return ListView(
            children: [
              SizedBox(height: 16),
              Padding(
                padding: EdgeInsets.all(16),
                child: StatsCard(
                  title: 'Active Campaigns',
                  value: provider.statistics?.campaigns.active.toString() ?? '0',
                  color: Colors.blue,
                ),
              ),
              Padding(
                padding: EdgeInsets.all(16),
                child: StatsCard(
                  title: 'Messages Sent',
                  value: provider.statistics?.metrics.totalSent.toString() ?? '0',
                  color: Colors.green,
                ),
              ),
              // More stats...
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        child: Icon(Icons.add),
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => CampaignBuilderScreen()),
        ),
      ),
    );
  }
}

// lib/screens/contacts/contact_import_screen.dart

class ContactImportScreen extends StatefulWidget {
  @override
  _ContactImportScreenState createState() => _ContactImportScreenState();
}

class _ContactImportScreenState extends State<ContactImportScreen> {
  File? _selectedFile;
  List<String> _selectedTags = [];
  bool _isImporting = false;
  
  void _selectFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'xlsx'],
    );
    
    if (result != null) {
      setState(() => _selectedFile = File(result.files.single.path!));
    }
  }
  
  void _importContacts() async {
    if (_selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select a file')),
      );
      return;
    }
    
    setState(() => _isImporting = true);
    
    try {
      final result = await context.read<ContactProvider>().importContacts(
        _selectedFile!.path,
        _selectedTags,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Imported ${result.successful} contacts')),
      );
      
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isImporting = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Import Contacts')),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: Icon(Icons.file_upload),
              title: Text(_selectedFile?.path.split('/').last ?? 'Select CSV/Excel file'),
              trailing: IconButton(
                icon: Icon(Icons.browse_gallery),
                onPressed: _selectFile,
              ),
            ),
          ),
          SizedBox(height: 16),
          Text('Tags (optional)'),
          // Tag selection widget
          SizedBox(height: 32),
          ElevatedButton(
            onPressed: _isImporting ? null : _importContacts,
            child: _isImporting
              ? SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text('Import Contacts'),
          ),
        ],
      ),
    );
  }
}

// lib/screens/campaigns/campaign_builder_screen.dart

class CampaignBuilderScreen extends StatefulWidget {
  @override
  _CampaignBuilderScreenState createState() => _CampaignBuilderScreenState();
}

class _CampaignBuilderScreenState extends State<CampaignBuilderScreen> {
  final _nameController = TextEditingController();
  final _messageController = TextEditingController();
  final _audienceProvider = ValueNotifier<List<String>>([]);
  final _sendModeProvider = ValueNotifier<String>('immediate');
  DateTime? _scheduledTime;
  
  @override
  void dispose() {
    _nameController.dispose();
    _messageController.dispose();
    _audienceProvider.dispose();
    _sendModeProvider.dispose();
    super.dispose();
  }
  
  void _createCampaign() async {
    try {
      await context.read<CampaignProvider>().createCampaign(
        name: _nameController.text,
        message: _messageController.text,
        audienceTags: _audienceProvider.value,
        sendMode: _sendModeProvider.value,
        scheduledAt: _sendModeProvider.value == 'scheduled' ? _scheduledTime : null,
      );
      
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Campaign created successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Create Campaign')),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: 'Campaign Name',
              border: OutlineInputBorder(),
            ),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _messageController,
            maxLines: 5,
            decoration: InputDecoration(
              labelText: 'Message',
              border: OutlineInputBorder(),
              hintText: 'Hi {{name}}, we have an exciting opportunity...',
            ),
          ),
          SizedBox(height: 16),
          Text('Audience Tags'),
          AudienceSelector(
            onChanged: (tags) => _audienceProvider.value = tags,
          ),
          SizedBox(height: 16),
          ValueListenableBuilder<String>(
            valueListenable: _sendModeProvider,
            builder: (context, sendMode, _) => Column(
              children: [
                SegmentedButton<String>(
                  segments: [
                    ButtonSegment(value: 'immediate', label: Text('Immediate')),
                    ButtonSegment(value: 'scheduled', label: Text('Scheduled')),
                  ],
                  selected: {sendMode},
                  onSelectionChanged: (Set<String> newSelection) {
                    _sendModeProvider.value = newSelection.first;
                  },
                ),
                if (sendMode == 'scheduled') ...[
                  SizedBox(height: 16),
                  SchedulePicker(
                    onDateTimeSelected: (dateTime) => _scheduledTime = dateTime,
                  ),
                ],
              ],
            ),
          ),
          SizedBox(height: 32),
          ElevatedButton(
            onPressed: _createCampaign,
            child: Text('Create Campaign'),
          ),
        ],
      ),
    );
  }
}
```

### 5. Navigation Structure

```dart
// lib/main.dart

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => ApiClient(token: 'your_token')),
        Provider(create: (context) => CampaignService(context.read<ApiClient>())),
        Provider(create: (context) => ContactService(context.read<ApiClient>())),
        ChangeNotifierProvider(
          create: (context) => CampaignProvider(context.read<CampaignService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ContactProvider(context.read<ContactService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => DashboardProvider(context.read<ApiClient>()),
        ),
      ],
      child: MaterialApp(
        title: 'Bliss Admin',
        theme: AppTheme.lightTheme,
        home: DashboardScreen(),
        routes: {
          '/campaigns': (_) => CampaignListScreen(),
          '/contacts': (_) => ContactListScreen(),
          '/import-contacts': (_) => ContactImportScreen(),
          '/settings': (_) => WhatsAppSettingsScreen(),
        },
      ),
    );
  }
}
```

## UI Screens Checklist

- [x] Dashboard
  - [x] Key metrics cards
  - [x] Campaign overview
  - [x] Queue status
  - [x] Charts/graphs

- [x] Contact Management
  - [x] Contact list with search
  - [x] Bulk import wizard
  - [x] Deduplication
  - [x] Tag management
  - [x] Opted-out contacts list

- [x] Campaign Management
  - [x] Campaign list
  - [x] Campaign builder
  - [x] Message preview
  - [x] Audience selector
  - [x] Schedule picker
  - [x] Campaign details/statistics
  - [x] Campaign controls (launch, pause, resume, delete)

- [x] Settings
  - [x] WhatsApp account info
  - [x] Connection status
  - [x] Test webhook

## Responsive Design

All screens should work on:
- Mobile (360px - 600px)
- Tablet (600px - 1024px)
- Desktop (1024px+)

Use responsive widgets:
- `LayoutBuilder`
- `MediaQuery`
- `FractionallySizedBox`
- `Column` with `Expanded`

## Error Handling

- Network errors
- Invalid file formats
- API errors
- Validation errors

Show user-friendly error messages in `SnackBar` or `AlertDialog`.

## Testing

Create unit tests for:
- API client
- Models
- Providers
- Services

Create integration tests for key flows.
