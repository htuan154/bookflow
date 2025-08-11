import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'hotel_model.dart';

class MapMarkers {
  static List<Marker> createMarkers({
    required LatLng currentLocation,
    required List<Hotel> hotels,
    required void Function(Hotel) onHotelTap,
    LatLng? selectedLocation,
  }) {
    List<Marker> markers = [];

    // Current location marker
    markers.add(
      Marker(
        point: currentLocation,
        width: 50,
        height: 50,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.blue,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Icon(Icons.person, color: Colors.white, size: 24),
        ),
      ),
    );

    // Selected location marker
    if (selectedLocation != null) {
      markers.add(
        Marker(
          point: selectedLocation,
          width: 50,
          height: 50,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.red,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Icon(Icons.location_pin, color: Colors.white, size: 24),
          ),
        ),
      );
    }

    // Hotel markers
    for (Hotel hotel in hotels) {
      markers.add(
        Marker(
          point: hotel.location,
          width: 60,
          height: 80,
          child: GestureDetector(
            onTap: () => onHotelTap(hotel),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getHotelCategoryColor(hotel.category),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 6,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(Icons.hotel, color: Colors.white, size: 20),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                    boxShadow: [
                      BoxShadow(color: Colors.black12, blurRadius: 4),
                    ],
                  ),
                  child: Text(
                    '\$${hotel.price.toInt()}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return markers;
  }

  static Color _getHotelCategoryColor(String category) {
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
}
