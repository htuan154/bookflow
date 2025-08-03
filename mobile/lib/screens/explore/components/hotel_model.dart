import 'package:latlong2/latlong.dart';

class Hotel {
  final String id;
  final String name;
  final String description;
  final double price;
  final double rating;
  final LatLng location;
  final String address;
  final String category;
  final List<String> amenities;
  final List<String> images;

  Hotel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.rating,
    required this.location,
    required this.address,
    required this.category,
    required this.amenities,
    required this.images,
  });
}
