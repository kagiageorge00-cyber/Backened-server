import 'package:flutter/material.dart';

class StaffDashboard extends StatelessWidget {
  const StaffDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('bliss connect Staff Dashboard'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              // TODO: show notifications
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              // TODO: handle logout
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: Colors.blueAccent),
              child: Text(
                'Admin Menu',
                style: TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('Agents'),
              onTap: () {
                // TODO: Navigate to Agents Management
              },
            ),
            ListTile(
              leading: const Icon(Icons.business),
              title: const Text('Sponsors'),
              onTap: () {
                // TODO: Navigate to Sponsors Management
              },
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Candidates'),
              onTap: () {
                // TODO: Navigate to Candidates Management
              },
            ),
            ListTile(
              leading: const Icon(Icons.work),
              title: const Text('Jobs'),
              onTap: () {
                // TODO: Navigate to Jobs Management
              },
            ),
            ListTile(
              leading: const Icon(Icons.payment),
              title: const Text('Commissions'),
              onTap: () {
                // TODO: Navigate to Commissions
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              onTap: () {
                // TODO: Navigate to Settings
              },
            ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Overview',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                  _buildDashboardCard('Agents', 120, Icons.people),
                  _buildDashboardCard('Sponsors', 45, Icons.business),
                  _buildDashboardCard('Candidates', 350, Icons.person),
                  _buildDashboardCard('Jobs', 78, Icons.work),
                  _buildDashboardCard('Commissions', 50000, Icons.payment),
                  _buildDashboardCard('Visa Requests', 20, Icons.flight),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardCard(String title, int count, IconData icon) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: Colors.blueAccent),
            const SizedBox(height: 16),
            Text(
              '$count',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
