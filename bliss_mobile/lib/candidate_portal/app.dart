import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'routes.dart';
import 'theme.dart';

class CandidatePortalApp extends StatelessWidget {
  const CandidatePortalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Builder(builder: (context) {
        final auth = Provider.of<AuthProvider>(context);
        return MaterialApp.router(
          title: 'Candidate Portal',
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode: auth.themeMode,
          routerConfig: CandidateRoutes.router(auth),
        );
      }),
    );
  }
}
