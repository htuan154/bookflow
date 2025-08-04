// widgets/custom_app_bar.dart
import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF2c5aa0), Color(0xFF1e3c72)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "9:41",
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          Row(
            children: [
              Icon(Icons.signal_cellular_4_bar, color: Colors.white, size: 16),
              SizedBox(width: 5),
              Icon(Icons.wifi, color: Colors.white, size: 16),
              SizedBox(width: 5),
              Icon(Icons.battery_full, color: Colors.white, size: 16),
            ],
          ),
        ],
      ),
    );
  }
}