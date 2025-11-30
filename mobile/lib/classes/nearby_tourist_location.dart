// Model cho địa điểm tham quan gần đây (có thêm distanceKm)
import 'tourist_location_model.dart';

class NearbyTouristLocation {
  final TouristLocation location;
  final double distanceKm;

  const NearbyTouristLocation({
    required this.location,
    required this.distanceKm,
  });

  factory NearbyTouristLocation.fromJson(Map<String, dynamic> json) {
    return NearbyTouristLocation(
      location: TouristLocation.fromJson({
        'location_id': json['locationId'],
        'name': json['name'],
        'description': json['description'],
        'city': json['city'],
        'image_url': json['imageUrl'],
        'latitude': json['latitude'],
        'longitude': json['longitude'],
        'created_at': json['createdAt'] != null && json['createdAt'].toString().isNotEmpty
            ? json['createdAt']
            : DateTime.now().toIso8601String(),
      }),
      distanceKm: (json['distanceKm'] as num).toDouble(),
    );
  }

  String get distanceText {
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).toStringAsFixed(0)}m';
    } else if (distanceKm < 10) {
      return '${distanceKm.toStringAsFixed(2)}km';
    } else {
      return '${distanceKm.toStringAsFixed(1)}km';
    }
  }
}
