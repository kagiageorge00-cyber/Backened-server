import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';

// Theme
import 'theme_notifier.dart';
import 'theme.dart';
import 'constants/app_constants.dart';

// Screens
import 'screens/home_screen.dart';
import 'screens/apply_screen.dart';
import 'screens/candidates_portal/candidate_portal_screen.dart';
import 'agents_portal/screens/agent_login_screen.dart';
import 'screens/staff_portal/staff_login_screen.dart';
import 'screens/visa_ticket_processing_screen.dart' as visaTicket;
import 'screens/travel_documents/travel_documents_screen.dart';
import 'screens/job_marketplace_screen.dart';
import 'screens/support_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/staff_portal/payments_screen.dart';
import 'screens/deployment_fee_payment_screen.dart';
import 'employers_portal/screens/employer_login_screen.dart';
import 'employers_portal/screens/employers_portal_screen.dart';
import 'employers_portal/screens/employer_signup_screen.dart';
import 'employers_portal/screens/candidate_details_screen.dart';
import 'employers_portal/screens/schedule_interview_screen.dart';
import 'screens/bliss_communication/screens/private_chats_details_screen.dart';
import 'screens/job_application_page_screen.dart';
import 'screens/candidate_form_screen.dart';
import 'screens/admin/admin_screen.dart';

// Services
import 'services/stripe_service.dart';
import 'services/app_initializer_service.dart';
import 'services/auth_service.dart';
import 'services/backend_auth.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Build and show the app immediately to avoid blocking the UI on heavy
  // native/service initialization. Heavy work runs in background.
  final app = ChangeNotifierProvider(
    create: (_) => ThemeNotifier()..loadThemeFromPrefs(),
    child: const BlissApp(),
  );

  runApp(app);

  // Fire-and-forget background initialization (Firebase, Stripe, services).
  _backgroundInit();
}

Future<void> _backgroundInit() async {
  try {
    await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform);
    if (!kIsWeb) {
      StripeService.init();
    }
    await AppInitializerService.initializeApp();
    debugPrint('Background initialization completed');
  } catch (e, st) {
    debugPrint('Background init failed: $e\n$st');
  }
}

class BlissApp extends StatefulWidget {
  const BlissApp({super.key});

  @override
  State<BlissApp> createState() => _BlissAppState();
}

class _BlissAppState extends State<BlissApp> {
  bool _loading = true;
  bool _authenticated = false;

  static final Map<String, WidgetBuilder> _routes = {
    '/apply': (_) => const ApplyScreen(),
    '/jobApplication': (_) => const JobApplicationPageScreen(),
    '/candidateForm': (context) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map<String, String>) {
        return CandidateFormScreen(
          phone: args['phone'],
          candidateId: args['candidateId'],
        );
      }
      return CandidateFormScreen(phone: args is String ? args : null);
    },
    '/candidateform': (context) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map<String, String>) {
        return CandidateFormScreen(
          phone: args['phone'],
          candidateId: args['candidateId'],
        );
      }
      return CandidateFormScreen(phone: args is String ? args : null);
    },
    '/candidatePortal': (_) => const CandidatePortalScreen(),
    '/candidates': (_) => const CandidatePortalScreen(),
    '/agentPortal': (_) => const AgentLoginScreen(),
    '/staffPortal': (_) => const StaffSignInScreen(),
    '/admin': (_) => const AdminScreen(),
    '/visaTicketProcessing': (_) =>
        const visaTicket.VisaTicketProcessingScreen(),
    '/travel_docs': (_) => const TravelDocumentsScreen(),
    '/jobMarketplace': (_) => const JobMarketplaceScreen(),
    '/support': (_) => const SupportScreen(),
    '/messages': (_) => const MessagesScreen(),
    '/payments': (_) => const PaymentsScreen(),
    '/payDeploymentFee': (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
      return DeploymentFeePaymentScreen(
        candidateId: args?['candidateId'] ?? '',
        employerId: args?['employerId'] ?? '',
      );
    },
    '/employer-login': (_) => const EmployerLoginScreen(),
    '/employer-signup': (_) => const EmployerSignUpScreen(),
    '/employersPortal': (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
      return EmployersPortalScreen(
        employerId: args?['employerId'] ?? '',
        employerName: args?['employerName'] ?? '',
        companyName: args?['companyName'] ?? '',
      );
    },
    '/candidate-details': (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
      return CandidateDetailsScreen(
        candidateId: args?['candidateId'] ?? '',
      );
    },
    '/schedule-interview': (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
      return ScheduleInterviewScreen(
        candidateId: args?['candidateId'] ?? '',
        candidateName: args?['candidateName'] ?? 'Candidate',
      );
    },
    '/privateChatDetails': (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
      return PrivateChatDetailsScreen(
        chatId: args?['chatId'] ?? '',
        otherUserId: args?['otherUserId'] ?? '',
        otherUserName: args?['otherUserName'] ?? '',
        otherUserAvatar: args?['otherUserAvatar'] ?? '',
      );
    },
  };

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  Future<void> _initSession() async {
    final ok = await AuthService().tryAutoLogin();
    setState(() {
      _loading = false;
      _authenticated = ok && BackendAuth.isAuthenticated;
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeNotifier = Provider.of<ThemeNotifier>(context);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: AppConstants.appName,
      theme: appLightTheme,
      darkTheme: appDarkTheme,
      themeMode: themeNotifier.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: _loading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _authenticated
              ? const HomeScreen()
              : const EmployerLoginScreen(),
      routes: _routes,
      onUnknownRoute: (settings) {
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Page not found')),
            body: Center(
              child: Text('No route defined for \\${settings.name}'),
            ),
          ),
        );
      },
    );
  }
}
