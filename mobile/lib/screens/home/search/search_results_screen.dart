import 'package:flutter/material.dart';
import '../../../classes/hotel_model.dart';
import '../components/hotel_card.dart';
import '../hotel/hotel_screen.dart'; // Thêm import này

class SearchResultsScreen extends StatelessWidget {
  final List<Hotel> hotels;
  final String searchType;
  final String? city;
  final String? ward;
  final Map<String, dynamic>? pagination;

  const SearchResultsScreen({
    Key? key,
    required this.hotels,
    required this.searchType,
    this.city,
    this.ward,
    this.pagination,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    String title = 'Kết quả tìm kiếm';
    String subtitle = '';

    if (searchType == 'location' && city != null && ward != null) {
      subtitle = 'Khách sạn tại $ward, $city';
    } else if (searchType == 'city' && city != null) {
      subtitle = 'Khách sạn tại $city';
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: Colors.black,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (subtitle.isNotEmpty)
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                  fontWeight: FontWeight.normal,
                ),
              ),
          ],
        ),
      ),
      body: hotels.isEmpty ? _buildEmptyState() : _buildHotelsList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hotel_outlined, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            'Không tìm thấy khách sạn',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Hãy thử tìm kiếm với từ khóa khác',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildHotelsList() {
    return Column(
      children: [
        // Header thông tin kết quả
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(16),
          color: Colors.grey[50],
          child: Text(
            'Tìm thấy ${hotels.length} khách sạn',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.grey[700],
            ),
          ),
        ),
        // Danh sách khách sạn
        Expanded(
          child: GridView.builder(
            padding: EdgeInsets.all(16),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio:
                  0.7, // Tăng từ 0.65 lên 0.7 để tăng chiều cao card
            ),
            itemCount: hotels.length,
            itemBuilder: (context, index) {
              final hotel = hotels[index];
              return HotelCard(
                name: hotel.name,
                address: hotel.address,
                starRating: hotel.starRating,
                phoneNumber: hotel.phoneNumber,
                email: hotel.email,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => HotelDetailScreen(hotel: hotel),
                    ),
                  );
                },
                onFavoritePressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đã thêm ${hotel.name} vào yêu thích'),
                    ),
                  );
                },
              );
            },
          ),
        ),
        // Pagination info (nếu có)
        if (pagination != null)
          Container(
            padding: EdgeInsets.all(16),
            child: Text(
              'Trang ${pagination!['page'] ?? 1} / ${pagination!['totalPages'] ?? 1}',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }
}
