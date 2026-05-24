import 'package:flutter/material.dart';

class CustomTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final String value;
  final VoidCallback? onTap;

  const CustomTile({
    super.key,
    required this.title,
    required this.icon,
    required this.color,
    required this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: SizedBox(
          width: 120,
          height: 120,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 36),
              const SizedBox(height: 8),
              Text(title, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 14)),
            ],
          ),
        ),
      ),
    );
  }
}
