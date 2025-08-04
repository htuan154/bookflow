// widgets/hotel_info.dart
import 'package:flutter/material.dart';
import '../widgets/hotel_model.dart';

class HotelInfo extends StatelessWidget {
  final Hotel hotel;
  final TabController tabController;

  HotelInfo({required this.hotel, required this.tabController});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            hotel.name,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 5),
          Text(
            hotel.location,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 20),
          TabBar(
            controller: tabController,
            labelColor: Colors.deepOrange,
            unselectedLabelColor: Colors.grey[600],
            indicatorColor: Colors.deepOrange,
            indicatorWeight: 3,
            labelStyle: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            tabs: [
              Tab(text: "About"),
              Tab(text: "Review"),
            ],
          ),
        ],
      ),
    );
  }
}