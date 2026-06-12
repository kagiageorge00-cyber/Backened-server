import 'package:flutter/material.dart';

class Sidebar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  const Sidebar(
      {super.key, required this.selectedIndex, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      extended: true,
      selectedIndex: selectedIndex,
      onDestinationSelected: onSelect,
      destinations: const [
        NavigationRailDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: Text('Dashboard')),
        NavigationRailDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: Text('Applications')),
        NavigationRailDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today),
            label: Text('Interviews')),
        NavigationRailDestination(
            icon: Icon(Icons.folder),
            selectedIcon: Icon(Icons.folder_open),
            label: Text('Documents')),
        NavigationRailDestination(
            icon: Icon(Icons.timeline),
            selectedIcon: Icon(Icons.timeline),
            label: Text('Progress Tracker')),
        NavigationRailDestination(
            icon: Icon(Icons.message),
            selectedIcon: Icon(Icons.message),
            label: Text('Messages')),
        NavigationRailDestination(
            icon: Icon(Icons.notifications),
            selectedIcon: Icon(Icons.notifications),
            label: Text('Notifications')),
        NavigationRailDestination(
            icon: Icon(Icons.public),
            selectedIcon: Icon(Icons.public),
            label: Text('Opportunities')),
        NavigationRailDestination(
            icon: Icon(Icons.person),
            selectedIcon: Icon(Icons.person),
            label: Text('Profile')),
        NavigationRailDestination(
            icon: Icon(Icons.settings),
            selectedIcon: Icon(Icons.settings),
            label: Text('Settings')),
      ],
    );
  }
}
