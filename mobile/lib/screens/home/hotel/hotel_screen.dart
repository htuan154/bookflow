import 'package:flutter/material.dart';
import '../../../classes/hotel_model.dart';
import '../../../classes/hotel_image_model.dart'; // Thêm import HotelImage
import '../../../services/hotel_service.dart';
import '../../../classes/review_model.dart'; // Thêm import này
import '../../../screens/home/review/review_detail_screen.dart';
import '../booking/booking_screen.dart';

class HotelDetailScreen extends StatefulWidget {
  final Hotel hotel;

  const HotelDetailScreen({Key? key, required this.hotel}) : super(key: key);

  @override
  _HotelDetailScreenState createState() => _HotelDetailScreenState();
}

class _HotelDetailScreenState extends State<HotelDetailScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late PageController _pageController; // Controller cho slider
  bool isFavorite = false;
  List<dynamic> amenities = [];
  List<HotelImage> hotelImages = []; // Đổi thành List<HotelImage>
  bool isLoadingAmenities = false;
  bool isLoadingImages = false;
  int currentImageIndex = 0; // Index hiện tại của slider
  List<Review> reviews = [];
  bool isLoadingReviews = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _pageController = PageController();
    _loadAmenities();
    _loadHotelImages();
    _loadReviews(); // Thêm dòng này
  }

  // Hàm load ảnh khách sạn
  Future<void> _loadHotelImages() async {
    setState(() {
      isLoadingImages = true;
    });

    try {
      print(
        'Loading images for hotel ID: ${widget.hotel.hotelId}',
      ); // Debug log
      final result = await HotelService().getHotelImages(widget.hotel.hotelId);

      print('API result: $result'); // Debug log để xem response

      if (result['success'] && result['data'] != null) {
        print('Images data from API: ${result['data']}'); // Debug log

        setState(() {
          // Parse data thành List<HotelImage>
          hotelImages = (result['data'] as List)
              .map(
                (json) => HotelImage.fromJson({
                  'image_id': json['imageId'],
                  'hotel_id': json['hotelId'],
                  'image_url': json['imageUrl'],
                  'caption': json['caption'],
                  'is_thumbnail': json['isThumbnail'] ?? false,
                  'order_index': null,
                  'uploaded_at': DateTime.now().toIso8601String(),
                }),
              )
              .toList();
        });
        print('Parsed hotelImages: ${hotelImages.length} items'); // Debug log
      } else {
        print('API call failed or no data: ${result['message']}'); // Debug log
        setState(() {
          hotelImages = [];
        });
      }
    } catch (e) {
      print('Error loading hotel images: $e');
      setState(() {
        hotelImages = [];
      });
    } finally {
      setState(() {
        isLoadingImages = false;
      });
    }
  }

  // Thêm hàm load tiện nghi
  Future<void> _loadAmenities() async {
    setState(() {
      isLoadingAmenities = true;
    });

    try {
      final result = await HotelService().getAmenitiesForHotel(
        widget.hotel.hotelId,
      );
      if (result['success']) {
        setState(() {
          amenities = result['data'] ?? [];
        });
      }
    } catch (e) {
      print('Error loading amenities: $e');
    } finally {
      setState(() {
        isLoadingAmenities = false;
      });
    }
  }

  Future<void> _loadReviews() async {
    setState(() {
      isLoadingReviews = true;
    });
    try {
      final result = await HotelService().getReviewsForHotel(
        widget.hotel.hotelId,
      );
      debugPrint('API getReviewsForHotel result: $result'); // Thêm dòng này

      if (result['success'] && result['data'] != null) {
        setState(() {
          reviews = (result['data'] as List)
              .map((json) => Review.fromJson(json))
              .toList();
        });
      } else {
        debugPrint(
          'Không lấy được review: ${result['message']}',
        ); // Thêm dòng này
        setState(() {
          reviews = [];
        });
      }
    } catch (e) {
      debugPrint('Lỗi khi load reviews: $e'); // Thêm dòng này
      setState(() {
        reviews = [];
      });
    } finally {
      setState(() {
        isLoadingReviews = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildHotelHeader(),
                _buildTabBar(),
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: _buildTabContent(),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBookingSection(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 300,
      floating: false,
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.arrow_back, color: Colors.black),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isFavorite ? Icons.favorite : Icons.favorite_border,
              color: isFavorite ? Colors.red : Colors.grey[600],
            ),
          ),
          onPressed: () {
            setState(() {
              isFavorite = !isFavorite;
            });
          },
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(background: _buildImageSlider()),
    );
  }

  Widget _buildImageSlider() {
    // Debug: In ra để kiểm tra
    print('isLoadingImages: $isLoadingImages');
    print('hotelImages length: ${hotelImages.length}');
    print('hotelImages data: $hotelImages');

    if (isLoadingImages) {
      return Container(
        color: Colors.grey[200],
        child: Center(child: CircularProgressIndicator(color: Colors.orange)),
      );
    }

    // Nếu không có ảnh từ API, dùng ảnh mặc định
    List<String> imagesToShow = [];

    if (hotelImages.isNotEmpty) {
      // Có ảnh từ API - sắp xếp theo isThumbnail và orderIndex
      List<HotelImage> sortedImages = [...hotelImages];
      sortedImages.sort((a, b) {
        // Ảnh thumbnail lên đầu
        if (a.isThumbnail && !b.isThumbnail) return -1;
        if (!a.isThumbnail && b.isThumbnail) return 1;
        // Sau đó sắp xếp theo orderIndex
        return (a.orderIndex ?? 0).compareTo(b.orderIndex ?? 0);
      });

      imagesToShow = sortedImages
          .map<String>((img) => img.imageUrl)
          .where((url) => url.isNotEmpty)
          .toList();
    }

    // Nếu vẫn không có ảnh nào, dùng ảnh mặc định
    if (imagesToShow.isEmpty) {
      return Container(
        width: double.infinity,
        height: double.infinity,
        child: Image.asset(
          'assets/welcome/welcome-image-1.png',
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              color: Colors.grey[300],
              child: Center(
                child: Icon(Icons.hotel, size: 64, color: Colors.grey[500]),
              ),
            );
          },
        ),
      );
    }

    return Stack(
      children: [
        // Slider ảnh
        PageView.builder(
          controller: _pageController,
          onPageChanged: (index) {
            setState(() {
              currentImageIndex = index;
            });
          },
          itemCount: imagesToShow.length,
          itemBuilder: (context, index) {
            return Container(
              width: double.infinity,
              height: double.infinity,
              child: Image.network(
                imagesToShow[index],
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Image.asset(
                    'assets/welcome/welcome-image-1.png',
                    fit: BoxFit.cover,
                  );
                },
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    color: Colors.grey[200],
                    child: Center(
                      child: CircularProgressIndicator(
                        color: Colors.orange,
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
          },
        ),

        // Dots indicator (chỉ hiện khi có > 1 ảnh)
        if (imagesToShow.length > 1)
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                imagesToShow.length,
                (index) => AnimatedContainer(
                  duration: Duration(milliseconds: 300),
                  margin: EdgeInsets.symmetric(horizontal: 4),
                  height: 8,
                  width: currentImageIndex == index ? 24 : 8,
                  decoration: BoxDecoration(
                    color: currentImageIndex == index
                        ? Colors.white
                        : Colors.white.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),

        // Image counter (chỉ hiện khi có > 1 ảnh)
        if (imagesToShow.length > 1)
          Positioned(
            top: 40,
            right: 16,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                '${currentImageIndex + 1}/${imagesToShow.length}',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

        // Caption overlay (nếu có caption)
        if (imagesToShow.length > 0 &&
            hotelImages.length > currentImageIndex &&
            hotelImages[currentImageIndex].caption != null &&
            hotelImages[currentImageIndex].caption!.isNotEmpty)
          Positioned(
            bottom: 60,
            left: 16,
            right: 16,
            child: Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                hotelImages[currentImageIndex].caption!,
                style: TextStyle(color: Colors.white, fontSize: 12),
                textAlign: TextAlign.center,
              ),
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
    if (isLoadingAmenities) {
      return Center(child: CircularProgressIndicator(color: Colors.orange));
    }

    if (amenities.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hotel_class, size: 64, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              'Chưa có tiện ích nào',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Khách sạn này chưa cập nhật thông tin tiện ích',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Tiện ích khách sạn (${amenities.length})'),
        SizedBox(height: 16),
        Expanded(
          child: GridView.builder(
            physics: BouncingScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: amenities.length,
            itemBuilder: (context, index) {
              if (index >= amenities.length) {
                // Trả về ô trống để lố
                return SizedBox.shrink();
              }
              final amenity = amenities[index];
              return _buildAmenityCard(amenity);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAmenityCard(dynamic amenity) {
    final String name = amenity['name'] ?? 'Tiện ích';
    final String description = amenity['description'] ?? '';

    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Icon container với kích thước cố định
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: amenity['iconUrl'] != null
                  ? Image.network(
                      amenity['iconUrl'],
                      width: 28,
                      height: 28,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Icon(
                          Icons.hotel_class,
                          color: Colors.orange,
                          size: 24,
                        );
                      },
                    )
                  : Icon(Icons.hotel_class, color: Colors.orange, size: 24),
            ),
          ),

          SizedBox(height: 8),

          // Tên tiện ích với container có chiều cao cố định
          Container(
            height: 32, // Chiều cao cố định cho 2 dòng text
            child: Center(
              child: Text(
                name,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                  height: 1.2,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
          ),

          // Mô tả với container có chiều cao cố định
          if (description.isNotEmpty) ...[
            SizedBox(height: 4),
            Container(
              height: 24, // Chiều cao cố định cho mô tả
              child: Center(
                child: Text(
                  description,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[600],
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ] else ...[
            // Thêm khoảng trống để cân bằng layout khi không có mô tả
            SizedBox(height: 28),
          ],
        ],
      ),
    );
  }

  Widget _buildReviewsTab() {
    if (isLoadingReviews) {
      return Center(child: CircularProgressIndicator(color: Colors.orange));
    }

    if (reviews.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.rate_review_outlined, size: 64, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              'Chưa có đánh giá',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: EdgeInsets.all(16),
      itemCount: reviews.length,
      separatorBuilder: (_, __) => SizedBox(height: 16),
      itemBuilder: (context, index) {
        return _buildReviewCard(reviews[index]);
      },
    );
  }

  Widget _buildReviewCard(Review review) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ReviewDetailScreen(review: review)),
        );
      },
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: User + Rating + Date
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.orange[100],
                  child: Icon(Icons.person, color: Colors.orange),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    review.username ?? 'Ẩn danh',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ),
                Row(
                  children: List.generate(
                    5,
                    (i) => Icon(
                      i < (review.rating ?? 0) ? Icons.star : Icons.star_border,
                      color: Colors.orange,
                      size: 18,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 14, color: Colors.grey[500]),
                SizedBox(width: 4),
                Text(
                  '${review.createdAt.day.toString().padLeft(2, '0')}/${review.createdAt.month.toString().padLeft(2, '0')}/${review.createdAt.year}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
            // Nếu có các điểm phụ, hiển thị thêm
            if (review.cleanlinessRating != null ||
                review.comfortRating != null ||
                review.serviceRating != null ||
                review.locationRating != null ||
                review.valueRating != null)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 4,
                  children: [
                    if (review.cleanlinessRating != null)
                      _buildSubRating('Sạch sẽ', review.cleanlinessRating!),
                    if (review.comfortRating != null)
                      _buildSubRating('Thoải mái', review.comfortRating!),
                    if (review.serviceRating != null)
                      _buildSubRating('Dịch vụ', review.serviceRating!),
                    if (review.locationRating != null)
                      _buildSubRating('Vị trí', review.locationRating!),
                    if (review.valueRating != null)
                      _buildSubRating('Giá trị', review.valueRating!),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubRating(String label, int value) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: TextStyle(fontSize: 12, color: Colors.grey[700]),
          ),
          Text(
            '$value',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.orange,
              fontSize: 12,
            ),
          ),
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
              onPressed: _showBooking,
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

  void _showBooking() {
    // Thay thế dialog bằng navigation tới BookingScreen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingScreen(hotel: widget.hotel),
      ),
    );
  }
}
