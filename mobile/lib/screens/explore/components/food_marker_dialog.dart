import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../../../classes/food_recommendation_model.dart';
import '../../../classes/tourist_location_model.dart';
import '../../../services/geocoding_service.dart';

class FoodMarkerDialog extends StatelessWidget {
  final FoodRecommendation food;
  final TouristLocation? location;
  final VoidCallback onClose;
  final VoidCallback? onExploreLocation;

  const FoodMarkerDialog({
    super.key,
    required this.food,
    this.location,
    required this.onClose,
    this.onExploreLocation,
  });

  static void show({
    required BuildContext context,
    required FoodRecommendation food,
    TouristLocation? location,
    required VoidCallback onClose,
    VoidCallback? onExploreLocation,
  }) {
    showDialog(
      context: context,
      builder: (context) => FoodMarkerDialog(
        food: food,
        location: location,
        onClose: onClose,
        onExploreLocation: onExploreLocation,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        constraints: BoxConstraints(maxHeight: 600),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header với ảnh
            _buildHeader(),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tên món ăn
                    Text(
                      food.name,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[900],
                      ),
                    ),
                    SizedBox(height: 12),

                    // Địa điểm
                    if (location != null) ...[
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.green.shade100),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.place, size: 18, color: Colors.green.shade700),
                            SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                location!.name,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.green.shade700,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 12),
                    ],

                    // Địa chỉ từ tọa độ
                    if (food.latitude != null && food.longitude != null)
                      _buildAddressSection(),

                    SizedBox(height: 16),

                    // Mô tả
                    if (food.description != null && food.description!.isNotEmpty) ...[
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade100),
                        ),
                        child: Text(
                          'Mô tả',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange.shade800,
                          ),
                        ),
                      ),
                      SizedBox(height: 12),
                      Text(
                        food.description!,
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.grey[800],
                          height: 1.6,
                          letterSpacing: 0.2,
                        ),
                      ),
                      SizedBox(height: 20),
                    ],

                    // Nút khám phá địa điểm
                    if (location != null && onExploreLocation != null)
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          onExploreLocation!();
                        },
                        icon: Icon(Icons.explore),
                        label: Text('Khám phá ${location!.name}'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  onClose();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey.shade200,
                  foregroundColor: Colors.grey.shade800,
                  padding: EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'Đóng',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    if (food.imageUrl != null && food.imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        child: Image.network(
          food.imageUrl!,
          height: 200,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildPlaceholderImage();
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              height: 200,
              child: Center(
                child: CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                      : null,
                ),
              ),
            );
          },
        ),
      );
    }
    return _buildPlaceholderImage();
  }

  Widget _buildPlaceholderImage() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Center(
        child: Icon(
          Icons.restaurant,
          size: 80,
          color: Colors.grey[600],
        ),
      ),
    );
  }

  Widget _buildAddressSection() {
    return FutureBuilder<String?>(
      future: GeocodingService.getAddressFromCoordinates(
        food.latitude!,
        food.longitude!,
      ),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Row(
            children: [
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: 8),
              Text('Đang tải địa chỉ...', style: TextStyle(fontSize: 12)),
            ],
          );
        }

        if (snapshot.hasData && snapshot.data != null) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.place, size: 16, color: Colors.grey[600]),
              SizedBox(width: 4),
              Expanded(
                child: Text(
                  snapshot.data!,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          );
        }

        return SizedBox.shrink();
      },
    );
  }
}
