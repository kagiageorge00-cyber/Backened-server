import 'package:flutter/material.dart';
import '../../../constants/app_constants.dart';

class BlissCommunicationScreen extends StatelessWidget {
  final String uid;
  final String name;
  final String role;
  final String profilePictureUrl;

  const BlissCommunicationScreen({
    super.key,
    required this.uid,
    required this.name,
    required this.role,
    required this.profilePictureUrl,
  });

  Widget menuCard({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [
              color.withOpacity(0.14),
              color.withOpacity(0.08),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black12.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 36, color: color.withOpacity(0.85)),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const subtitleStyle = TextStyle(
      fontSize: 14,
      color: Colors.black54,
    );

    return Scaffold(
      backgroundColor: const Color(0xfff4f6f9),

      // ---------------- APP BAR ----------------
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.grey.shade300,
              backgroundImage: profilePictureUrl.isNotEmpty
                  ? NetworkImage(profilePictureUrl)
                  : null,
              child: profilePictureUrl.isEmpty
                  ? const Icon(Icons.person, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  role.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),

      // ---------------- BODY ----------------
      body: Padding(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          children: [
            Expanded(
              child: LayoutBuilder(
                builder: (_, constraints) {
                  int gridCount = constraints.maxWidth > 900
                      ? 4
                      : constraints.maxWidth > 600
                          ? 3
                          : 2;

                  return GridView.count(
                    crossAxisCount: gridCount,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.92,
                    children: [
                      menuCard(
                        icon: Icons.campaign_rounded,
                        title: "Announcements",
                        color: Colors.deepPurple,
                        onTap: () => Navigator.pushNamed(
                            context, '/blissAnnouncements'),
                      ),
                      menuCard(
                        icon: Icons.language_rounded,
                        title: "Global Chat",
                        color: Colors.blueAccent,
                        onTap: () =>
                            Navigator.pushNamed(context, '/globalChat'),
                      ),
                      menuCard(
                        icon: Icons.lock_rounded,
                        title: "Private Chats",
                        color: Colors.green,
                        onTap: () =>
                            Navigator.pushNamed(context, '/privateChatList'),
                      ),
                      menuCard(
                        icon: Icons.support_agent_rounded,
                        title: "Support Tickets",
                        color: Colors.orange,
                        onTap: () =>
                            Navigator.pushNamed(context, '/supportTickets'),
                      ),
                      menuCard(
                        icon: Icons.notifications_rounded,
                        title: "Notifications",
                        color: Colors.redAccent,
                        onTap: () =>
                            Navigator.pushNamed(context, '/notifications'),
                      ),
                      menuCard(
                        icon: Icons.settings_rounded,
                        title: "Settings",
                        color: Colors.grey,
                        onTap: () =>
                            Navigator.pushNamed(context, '/settings'),
                      ),
                    ],
                  );
                },
              ),
            ),

            // ---------------- FOOTER ----------------
            Center(
              child: Text(
                AppConstants.companyCopyright,
                style: subtitleStyle,
              ),
            ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}
