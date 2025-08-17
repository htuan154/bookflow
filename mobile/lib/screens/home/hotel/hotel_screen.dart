//
// // screens/hotel_detail_screen.dart
// import 'package:flutter/material.dart';
// import '../../../classes/hotel_model.dart'; // Import Hotel model thực
// import '../hotel/widgets/custom_app_bar.dart';
// import '../hotel/widgets/hotel_info.dart';
// import '../hotel/widgets/tab_content.dart';
// import '../hotel/widgets/image_slider.dart';
// import '../hotel/widgets/booking_section.dart';

// class HotelDetailScreen extends StatefulWidget {
//   final Hotel hotel; // Thêm parameter này

//   const HotelDetailScreen({Key? key, required this.hotel})
//     : super(key: key); // Thêm constructor

//   @override
//   _HotelDetailScreenState createState() => _HotelDetailScreenState();
// }

// class _HotelDetailScreenState extends State<HotelDetailScreen>
//     with TickerProviderStateMixin {
//   late TabController _tabController;

//   @override
//   void initState() {
//     super.initState();
//     _tabController = TabController(length: 2, vsync: this);
//     // Xóa dòng hotel = Hotel.mockData(); vì giờ dùng widget.hotel
//   }

//   @override
//   void dispose() {
//     _tabController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: Colors.grey[50],
//       body: SafeArea(
//         child: Column(
//           children: [
//             CustomAppBar(),
//             Expanded(
//               child: SingleChildScrollView(
//                 child: Column(
//                   children: [
//                     ImageSlider(
//                       images: _getHotelImages(),
//                     ), // Sửa để dùng dữ liệu thực
//                     HotelInfo(
//                       hotel: widget.hotel, // Dùng widget.hotel thay vì hotel
//                       tabController: _tabController,
//                     ),
//                     Container(
//                       height: 400,
//                       child: TabBarView(
//                         controller: _tabController,
//                         children: [
//                           TabContent.about(widget.hotel), // Dùng widget.hotel
//                           TabContent.reviews(
//                             _getHotelReviews(),
//                           ), // Tạm thời dùng empty list
//                         ],
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//             BookingSection(price: _getHotelPrice()), // Sửa để lấy giá từ hotel
//           ],
//         ),
//       ),
//     );
//   }

//   // Helper methods để convert dữ liệu
//   List<String> _getHotelImages() {
//     // Luôn dùng ảnh mặc định này
//     return ['assets/welcome/welcome-image-1.png'];
//   }

//   List<dynamic> _getHotelReviews() {
//     // Tạm thời return empty list vì chưa có reviews trong model
//     return [];
//   }

//   double _getHotelPrice() {
//     // Lấy giá từ hotel model hoặc return default
//     return widget.hotel.pricePerNight?.toDouble() ?? 0.0;
//   }
// }

import 'package:flutter/material.dart';
import '../../../classes/hotel_model.dart';

class HotelDetailScreen extends StatefulWidget {
  final Hotel hotel;

  const HotelDetailScreen({Key? key, required this.hotel}) : super(key: key);

  @override
  _HotelDetailScreenState createState() => _HotelDetailScreenState();
}

class _HotelDetailScreenState extends State<HotelDetailScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool isFavorite = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          // Custom App Bar
          _buildSliverAppBar(),

          // Hotel Content
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHotelHeader(),
                  SizedBox(height: 20),
                  _buildTabBar(),
                  SizedBox(height: 20),
                  _buildTabContent(),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBookingSection(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 300.0,
      floating: false,
      pinned: true,
      backgroundColor: Colors.white,
      foregroundColor: Colors.black,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: AssetImage(
                'assets/welcome/welcome-image-1.png',
              ), // Dùng ảnh mặc định
              fit: BoxFit.cover,
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black.withOpacity(0.3)],
              ),
            ),
          ),
        ),
      ),
      actions: [
        Container(
          margin: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              isFavorite ? Icons.favorite : Icons.favorite_outline,
              color: isFavorite ? Colors.red : Colors.grey[700],
            ),
            onPressed: () {
              setState(() {
                isFavorite = !isFavorite;
              });
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHotelHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.hotel.name,
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${widget.hotel.address}, ${widget.hotel.city}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (widget.hotel.starRating != null)
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star, color: Colors.white, size: 16),
                    SizedBox(width: 4),
                    Text(
                      '${widget.hotel.starRating}',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        SizedBox(height: 16),

        // Star Rating Row
        if (widget.hotel.starRating != null)
          Row(
            children: [
              ...List.generate(5, (index) {
                return Icon(
                  index < widget.hotel.starRating!
                      ? Icons.star
                      : Icons.star_border,
                  color: Colors.orange,
                  size: 20,
                );
              }),
              SizedBox(width: 8),
              Text(
                '(${widget.hotel.totalReviews} đánh giá)',
                style: TextStyle(color: Colors.grey[600], fontSize: 14),
              ),
              SizedBox(width: 16),
              Text(
                'Điểm: ${widget.hotel.averageRating.toStringAsFixed(1)}/5.0',
                style: TextStyle(
                  color: Colors.orange,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(25),
      ),
      child: TabBar(
        controller: _tabController,
        indicatorSize: TabBarIndicatorSize.tab,
        indicator: BoxDecoration(
          color: Colors.orange,
          borderRadius: BorderRadius.circular(25),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Colors.grey[600],
        tabs: [
          Tab(text: 'Thông tin'),
          Tab(text: 'Tiện ích'),
          Tab(text: 'Đánh giá'),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    return Container(
      height: 400,
      child: TabBarView(
        controller: _tabController,
        children: [_buildAboutTab(), _buildAmenitiesTab(), _buildReviewsTab()],
      ),
    );
  }

  Widget _buildAboutTab() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Description
          if (widget.hotel.description != null &&
              widget.hotel.description!.isNotEmpty) ...[
            _buildSectionTitle('Mô tả'),
            SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Text(
                widget.hotel.description!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
            ),
            SizedBox(height: 20),
          ],

          // Contact Information
          _buildSectionTitle('Thông tin liên hệ'),
          SizedBox(height: 12),
          _buildInfoCard([
            _buildInfoRow(
              Icons.location_on,
              'Địa chỉ',
              '${widget.hotel.address}, ${widget.hotel.city}',
            ),
            if (widget.hotel.phoneNumber != null)
              _buildInfoRow(
                Icons.phone,
                'Số điện thoại',
                widget.hotel.phoneNumber!,
              ),
            if (widget.hotel.email != null)
              _buildInfoRow(Icons.email, 'Email', widget.hotel.email!),
          ]),

          SizedBox(height: 20),

          // Check-in/out Times
          _buildSectionTitle('Thời gian'),
          SizedBox(height: 12),
          _buildInfoCard([
            if (widget.hotel.checkInTime != null)
              _buildInfoRow(Icons.login, 'Check-in', widget.hotel.checkInTime!),
            if (widget.hotel.checkOutTime != null)
              _buildInfoRow(
                Icons.logout,
                'Check-out',
                widget.hotel.checkOutTime!,
              ),
          ]),

          SizedBox(height: 20),

          // Hotel Status
          _buildSectionTitle('Trạng thái'),
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: widget.hotel.status == 'approved'
                  ? Colors.green
                  : Colors.orange,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _getStatusText(widget.hotel.status),
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenitiesTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hotel_class, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            'Thông tin tiện ích',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Sẽ được cập nhật sớm',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.rate_review_outlined, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            widget.hotel.totalReviews > 0
                ? '${widget.hotel.totalReviews} đánh giá'
                : 'Chưa có đánh giá',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          if (widget.hotel.averageRating > 0) ...[
            SizedBox(height: 8),
            Text(
              'Điểm trung bình: ${widget.hotel.averageRating.toStringAsFixed(1)}/5.0',
              style: TextStyle(
                fontSize: 16,
                color: Colors.orange,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.orange, size: 20),
          SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 2),
              Container(
                width: MediaQuery.of(context).size.width - 120,
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBookingSection() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Giá từ',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                Text(
                  'Liên hệ', // Giá tạm thời, sau này sẽ có API
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _showBookingDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Đặt phòng',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'approved':
        return 'Đã được duyệt';
      case 'pending':
        return 'Đang chờ duyệt';
      case 'rejected':
        return 'Bị từ chối';
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Ngưng hoạt động';
      default:
        return 'Không xác định';
    }
  }

  void _showBookingDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Đặt phòng'),
        content: Text(
          'Tính năng đặt phòng sẽ được phát triển trong tương lai.\n\nHiện tại bạn có thể liên hệ trực tiếp qua:\n${widget.hotel.phoneNumber ?? 'SĐT sẽ cập nhật sớm'}\n${widget.hotel.email ?? 'Email sẽ cập nhật sớm'}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Đóng'),
          ),
        ],
      ),
    );
  }
}
