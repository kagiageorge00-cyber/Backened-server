import 'package:flutter/material.dart';
import '../widgets/logo.dart';
import 'admin/admin_screen.dart'; // 🔥 ADMIN

class ApplyHomeScreen extends StatelessWidget {
  const ApplyHomeScreen({super.key});

  void _openAdmin(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const AdminScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF0F2027),
              Color(0xFF2C5364),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [

              // =========================
              // 🔵 HEADER (BRANDING + SECRET ADMIN)
              // =========================
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [

                    // 🔥 SECRET ADMIN ACCESS (LONG PRESS)
                    GestureDetector(
                      onLongPress: () => _openAdmin(context),
                      child: const Logo(
                        height: 70,
                      ),
                    ),

                    const SizedBox(height: 10),

                    const Text(
                      "Bliss Connect",
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 6),

                    Text(
                      "Connecting People to Global Opportunities",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // =========================
              // 🧾 CONTENT CARD
              // =========================
              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(30),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      const Text(
                        "Start Your Journey 🌍",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 10),

                      const Text(
                        "Apply for jobs abroad, showcase your profile, and get hired faster with video and verified profiles.",
                        style: TextStyle(height: 1.5),
                      ),

                      const SizedBox(height: 25),

                      // =========================
                      // FEATURES
                      // =========================
                      _featureTile(Icons.video_call, "Upload intro video"),
                      _featureTile(Icons.verified, "Verified profile"),
                      _featureTile(Icons.public, "Global job access"),
                      _featureTile(Icons.flash_on, "Fast hiring process"),

                      const Spacer(),

                      // =========================
                      // 🚀 BUTTONS
                      // =========================
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: Colors.blueAccent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: () {
                            Navigator.pushNamed(context, '/apply');
                          },
                          child: const Text(
                            "Start Application",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: () {
                            Navigator.pushNamed(context, '/jobMarketplace');
                          },
                          child: const Text("Browse Jobs First"),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =========================
  // 🔹 FEATURE TILE
  // =========================
  static Widget _featureTile(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: Colors.blueAccent),
          const SizedBox(width: 10),
          Text(text),
        ],
      ),
    );
  }
}