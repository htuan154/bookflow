import 'package:flutter/material.dart';
import '../../../classes/hotel_model.dart';
import '../../../classes/roomtypeavailability_model.dart';
import '../components/hotel_card.dart';
import '../hotel/hotel_screen.dart';

class SearchResultsScreen extends StatelessWidget {
  final List<Hotel> hotels;
  final String searchType;
  final String? city;
  final String? ward;
  final Map<String, dynamic>? pagination;
  final List<RoomTypeAvailability>? suitableRooms;
  final Map<String, dynamic>? searchParams;

  const SearchResultsScreen({
    super.key,
    required this.hotels,
    required this.searchType,
    this.city,
    this.ward,
    this.pagination,
    this.suitableRooms,
    this.searchParams,
  });

  @override
  Widget build(BuildContext context) {
    String title = 'Kết quả tìm kiếm';
    String subtitle = '';

    if (searchType == 'availability') {
      if (city != null && ward != null) {
        subtitle = 'Phòng trống tại $ward, $city';
      } else if (city != null) {
        subtitle = 'Phòng trống tại $city';
      }
      
      // Thêm thông tin ngày và số lượng với format đẹp hơn
      if (searchParams != null) {
        final checkInFormatted = searchParams!['checkInDateFormatted'] ?? searchParams!['checkInDate'];
        final checkOutFormatted = searchParams!['checkOutDateFormatted'] ?? searchParams!['checkOutDate'];
        final guests = searchParams!['guestCount'];
        final rooms = searchParams!['roomCount'];
        subtitle += '\n$checkInFormatted → $checkOutFormatted • $guests khách, $rooms phòng';
      }
    } else if (searchType == 'location' && city != null && ward != null) {
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
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
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
            searchType == 'availability' 
                ? 'Không tìm thấy phòng trống'
                : 'Không tìm thấy khách sạn',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            searchType == 'availability'
                ? 'Hãy thử thay đổi ngày hoặc giảm số khách'
                : 'Hãy thử tìm kiếm với từ khóa khác',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildHotelsList() {
    return Column(
      children: [
        // Header thông tin kết quả với search params
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(16),
          color: Colors.grey[50],
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                searchType == 'availability'
                    ? 'Tìm thấy ${hotels.length} khách sạn có phòng trống'
                    : 'Tìm thấy ${hotels.length} khách sạn',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[700],
                ),
              ),
              if (suitableRooms != null && suitableRooms!.isNotEmpty)
                Text(
                  '${suitableRooms!.length} loại phòng phù hợp điều kiện',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              // Hiển thị thông tin search params
              if (searchParams != null && searchType == 'availability')
                Container(
                  margin: EdgeInsets.only(top: 8),
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.calendar_today, size: 14, color: Colors.orange[700]),
                                SizedBox(width: 4),
                                Text(
                                  '${searchParams!['checkInDateFormatted'] ?? searchParams!['checkInDate']} → ${searchParams!['checkOutDateFormatted'] ?? searchParams!['checkOutDate']}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange[700],
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.people, size: 14, color: Colors.orange[700]),
                                SizedBox(width: 4),
                                Text(
                                  '${searchParams!['guestCount']} khách',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.orange[700],
                                  ),
                                ),
                                SizedBox(width: 12),
                                Icon(Icons.hotel, size: 14, color: Colors.orange[700]),
                                SizedBox(width: 4),
                                Text(
                                  '${searchParams!['roomCount']} phòng',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.orange[700],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            ],
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
              childAspectRatio: 0.7,
            ),
            itemCount: hotels.length,
            itemBuilder: (context, index) {
              final hotel = hotels[index];
              
              // Đếm số loại phòng phù hợp của khách sạn này
              int availableRoomTypes = 0;
              if (suitableRooms != null) {
                availableRoomTypes = suitableRooms!
                    .where((room) => room.hotelId == hotel.hotelId)
                    .length;
              }
              
              return HotelCard(
                name: hotel.name,
                address: hotel.address,
                starRating: hotel.starRating,
                phoneNumber: hotel.phoneNumber,
                email: hotel.email,
                onTap: () {
                  // Tạo suitableRoomsForHotel - lọc từ suitableRooms chỉ lấy phòng của hotel này
                  List<RoomTypeAvailability>? suitableRoomsForHotel;
                  if (suitableRooms != null) {
                    suitableRoomsForHotel = suitableRooms!
                        .where((room) => room.hotelId == hotel.hotelId)
                        .toList();
                  }
                  
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => HotelDetailScreen(
                        hotel: hotel,
                        suitableRoomsForHotel: suitableRoomsForHotel, // Truyền rooms đã lọc
                        searchParams: searchParams, // Truyền search params (có ngày nhận, ngày trả, số khách, số phòng)
                      ),
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
