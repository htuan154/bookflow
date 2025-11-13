import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../../../classes/tourist_location_model.dart';
import '../../../classes/food_recommendation_model.dart';
import '../../../services/geocoding_service.dart';

class TouristLocationDialog extends StatelessWidget {
  final TouristLocation location;
  final List<FoodRecommendation> nearbyFoods;
  final VoidCallback onClose;
  final Function(FoodRecommendation)? onFoodSelected;

  const TouristLocationDialog({
    super.key,
    required this.location,
    required this.nearbyFoods,
    required this.onClose,
    this.onFoodSelected,
  });

  static void show({
    required BuildContext context,
    required TouristLocation location,
    required List<FoodRecommendation> nearbyFoods,
    required VoidCallback onClose,
    Function(FoodRecommendation)? onFoodSelected,
  }) {
    showDialog(
      context: context,
      builder: (context) => TouristLocationDialog(
        location: location,
        nearbyFoods: nearbyFoods,
        onClose: onClose,
        onFoodSelected: onFoodSelected,
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
        constraints: BoxConstraints(maxHeight: 700),
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
                    // Tên địa điểm
                    Text(
                      location.name,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[900],
                      ),
                    ),
                    SizedBox(height: 12),

                    // Thành phố
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.shade100),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.location_city, size: 16, color: Colors.blue.shade700),
                          SizedBox(width: 6),
                          Text(
                            location.city,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 12),

                    // Địa chỉ từ tọa độ
                    if (location.latitude != null && location.longitude != null)
                      _buildAddressSection(),

                    SizedBox(height: 16),

                    // Mô tả
                    if (location.description != null && location.description!.isNotEmpty) ...[
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
                        location.description!,
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.grey[800],
                          height: 1.6,
                          letterSpacing: 0.2,
                        ),
                      ),
                      SizedBox(height: 20),
                    ],

                    // Danh sách món ăn gần đây
                    if (nearbyFoods.isNotEmpty) ...[
                      Divider(thickness: 1, color: Colors.grey.shade200),
                      SizedBox(height: 16),
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade100),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.restaurant_menu, size: 20, color: Colors.orange.shade800),
                            SizedBox(width: 8),
                            Text(
                              'Món ăn ngon ở gần đây',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.orange.shade800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 16),
                      ...nearbyFoods.map((food) => _buildFoodItem(context, food)).toList(),
                    ],
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
    if (location.imageUrl != null && location.imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        child: Image.network(
          location.imageUrl!,
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
          Icons.place,
          size: 80,
          color: Colors.grey[600],
        ),
      ),
    );
  }

  Widget _buildAddressSection() {
    return FutureBuilder<String?>(
      future: GeocodingService.getAddressFromCoordinates(
        location.latitude!,
        location.longitude!,
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

  Widget _buildFoodItem(BuildContext context, FoodRecommendation food) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      elevation: 2,
      shadowColor: Colors.orange.shade100,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.orange.shade50, width: 1),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Ảnh món ăn
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: food.imageUrl != null && food.imageUrl!.isNotEmpty
                  ? Image.network(
                      food.imageUrl!,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildFoodPlaceholder();
                      },
                    )
                  : _buildFoodPlaceholder(),
            ),
            SizedBox(width: 14),

            // Thông tin món ăn
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    food.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (food.description != null && food.description!.isNotEmpty) ...[
                    SizedBox(height: 4),
                    Text(
                      food.description!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[700],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),

            // Nút xem
            ElevatedButton(
              onPressed: () {
                if (onFoodSelected != null) {
                  Navigator.pop(context);
                  onFoodSelected!(food);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange.shade600,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
              child: Text(
                'Xem',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFoodPlaceholder() {
    return Container(
      width: 70,
      height: 70,
      decoration: BoxDecoration(
        color: Colors.orange.shade100,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        Icons.restaurant,
        size: 35,
        color: Colors.orange.shade400,
      ),
    );
  }
}
