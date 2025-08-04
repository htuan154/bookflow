// widgets/tab_content.dart
import 'package:flutter/material.dart';
import '../widgets/hotel_model.dart';
import 'amenity_grid.dart';
import 'review_list.dart';

class TabContent {
  static Widget about(Hotel hotel) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AmenityGrid(amenities: hotel.amenities),
          SizedBox(height: 20),
          Text(
            "Description",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 10),
          Text(
            hotel.description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  static Widget reviews(List<Review> reviews) {
    return ReviewList(reviews: reviews);
  }
}