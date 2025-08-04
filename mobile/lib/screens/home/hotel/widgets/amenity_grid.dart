// widgets/amenity_grid.dart
import 'package:flutter/material.dart';
import '../widgets/hotel_model.dart';

class AmenityGrid extends StatelessWidget {
  final List<Amenity> amenities;

  AmenityGrid({required this.amenities});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 15,
        mainAxisSpacing: 15,
        childAspectRatio: 3,
      ),
      itemCount: amenities.length,
      itemBuilder: (context, index) {
        return Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Center(
                child: Text(
                  amenities[index].icon,
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                amenities[index].name,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        );
      },
    );
  }
}