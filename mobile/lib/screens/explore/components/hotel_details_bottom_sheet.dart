import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'hotel_model.dart';

class HotelDetailsBottomSheet extends StatelessWidget {
  final Hotel hotel;
  final LatLng currentLocation;
  final void Function(LatLng) onGetDirections;
  final void Function(Hotel) onBookHotel;

  const HotelDetailsBottomSheet({
    Key? key,
    required this.hotel,
    required this.currentLocation,
    required this.onGetDirections,
    required this.onBookHotel,
  }) : super(key: key);

  Color _getHotelCategoryColor(String category) {
    switch (category) {
      case 'luxury':
        return Colors.purple;
      case 'resort':
        return Colors.green;
      case 'business':
        return Colors.blue;
      case 'boutique':
        return Colors.orange;
      case 'modern':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          boxShadow: [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 10,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: SingleChildScrollView(
          controller: scrollController,
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              SizedBox(height: 16),

              // Hotel image
              Container(
                height: 200,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.grey[300],
                ),
                child: Center(
                  child: Icon(Icons.hotel, size: 60, color: Colors.grey[600]),
                ),
              ),
              SizedBox(height: 16),

              // Hotel info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      hotel.name,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getHotelCategoryColor(hotel.category),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      hotel.category.toUpperCase(),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),

              SizedBox(height: 8),

              // Address
              Row(
                children: [
                  Icon(Icons.location_on, color: Colors.grey[600], size: 16),
                  SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      hotel.address,
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ),
                ],
              ),

              SizedBox(height: 8),

              // Rating and price
              Row(
                children: [
                  Icon(Icons.star, color: Colors.orange, size: 18),
                  SizedBox(width: 4),
                  Text(
                    '${hotel.rating}',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(width: 16),
                  Text(
                    '\$${hotel.price.toInt()}/night',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),

              SizedBox(height: 12),

              // Description
              Text(
                hotel.description,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),

              SizedBox(height: 16),

              // Amenities
              Text(
                'Amenities',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: hotel.amenities
                    .map(
                      (amenity) => Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Text(amenity, style: TextStyle(fontSize: 12)),
                      ),
                    )
                    .toList(),
              ),

              SizedBox(height: 24),

              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => onGetDirections(hotel.location),
                      icon: Icon(Icons.directions),
                      label: Text('Directions'),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => onBookHotel(hotel),
                      icon: Icon(Icons.book_online),
                      label: Text('Book Now'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),

              SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
