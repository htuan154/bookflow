import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../classes/room_type_model.dart';
import '../../../classes/room_type_image_model.dart';
import '../../../classes/season_pricing_model.dart';
import '../../../services/hotel_service.dart';
import 'booking_detail_screen.dart'; // Thêm nếu chưa có
import '../../../classes/hotel_model.dart'; // Thêm dòng này

class RoomTypeDetailScreen extends StatefulWidget {
  final Hotel hotel; // Thêm dòng này
  final RoomType roomType;
  final Map<String, dynamic>? calculatedRoom;
  final double? calculatedPrice;
  final List<SeasonalPricing>? seasonalPricings;
  final bool? isRoomSuitable;
  final Map<String, dynamic>? searchParams; // Thêm dòng này

  const RoomTypeDetailScreen({
    super.key,
    required this.hotel, // Thêm dòng này
    required this.roomType,
    this.calculatedRoom,
    this.calculatedPrice,
    this.seasonalPricings,
    this.isRoomSuitable,
    this.searchParams, // Thêm dòng này
  });

  @override
  _RoomTypeDetailScreenState createState() => _RoomTypeDetailScreenState();
}

class _RoomTypeDetailScreenState extends State<RoomTypeDetailScreen> {
  List<RoomTypeImage> roomTypeImages = [];
  bool isLoadingImages = false;
  int currentImageIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _loadRoomTypeImages();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadRoomTypeImages() async {
    if (widget.roomType.roomTypeId == null) return;

    setState(() {
      isLoadingImages = true;
    });

    try {
      final result = await HotelService().getRoomTypeImages(
        widget.roomType.roomTypeId!,
      );

      if (result['success'] && result['data'] != null) {
        setState(() {
          roomTypeImages = (result['data'] as List)
              .map(
                (json) => RoomTypeImage.fromJson({
                  'image_id': json['imageId'] ?? json['image_id'],
                  'room_type_id': json['roomTypeId'] ?? json['room_type_id'],
                  'image_url': json['imageUrl'] ?? json['image_url'],
                  'caption': json['caption'],
                  'is_thumbnail':
                      json['isThumbnail'] ?? json['is_thumbnail'] ?? false,
                  'uploaded_at': json['uploadedAt'] ?? json['uploaded_at'],
                }),
              )
              .toList();

          // Sắp xếp: thumbnail trước, sau đó theo thứ tự upload
          roomTypeImages.sort((a, b) {
            if (a.isThumbnail && !b.isThumbnail) return -1;
            if (!a.isThumbnail && b.isThumbnail) return 1;

            // Xử lý null safety cho uploadedAt
            if (a.uploadedAt == null && b.uploadedAt == null) return 0;
            if (a.uploadedAt == null) return 1;
            if (b.uploadedAt == null) return -1;

            return a.uploadedAt!.compareTo(b.uploadedAt!);
          });
        });
      } else {
        setState(() {
          roomTypeImages = [];
        });
      }
    } catch (e) {
      setState(() {
        roomTypeImages = [];
      });
      print('Error loading room type images: $e');
    } finally {
      setState(() {
        isLoadingImages = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isRoomSuitable = widget.isRoomSuitable ?? true;
    final seasonalPricings = widget.seasonalPricings ?? [];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildRoomTypeHeader(isRoomSuitable),
                  SizedBox(height: 24),
                  _buildRoomSuitabilityInfo(isRoomSuitable),
                  SizedBox(height: 24),
                  _buildRoomTypeDetails(),
                  if (widget.calculatedPrice != null && isRoomSuitable) ...[
                    SizedBox(height: 24),
                    _buildPriceBredown(),
                  ],
                  if (seasonalPricings.isNotEmpty && isRoomSuitable) ...[
                    SizedBox(height: 24),
                    _buildSeasonalPricingInfo(),
                  ],
                  SizedBox(height: 100), // Space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBookingButton(isRoomSuitable),
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
      flexibleSpace: FlexibleSpaceBar(background: _buildImageSlider()),
    );
  }

  Widget _buildImageSlider() {
    if (isLoadingImages) {
      return Container(
        color: Colors.grey[200],
        child: Center(child: CircularProgressIndicator(color: Colors.orange)),
      );
    }

    if (roomTypeImages.isEmpty) {
      return Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.grey[200],
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.bed_outlined, size: 64, color: Colors.grey[400]),
              SizedBox(height: 16),
              Text(
                'Không có hình ảnh',
                style: TextStyle(fontSize: 16, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );
    }

    return Stack(
      children: [
        PageView.builder(
          controller: _pageController,
          onPageChanged: (index) {
            setState(() {
              currentImageIndex = index;
            });
          },
          itemCount: roomTypeImages.length,
          itemBuilder: (context, index) {
            final image = roomTypeImages[index];
            return SizedBox(
              width: double.infinity,
              height: double.infinity,
              child: Image.network(
                image.imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[200],
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.broken_image,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Lỗi tải ảnh',
                            style: TextStyle(color: Colors.grey[500]),
                          ),
                        ],
                      ),
                    ),
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

        // Image indicators
        if (roomTypeImages.length > 1)
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                roomTypeImages.length,
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

        // Image counter
        if (roomTypeImages.length > 1)
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
                '${currentImageIndex + 1}/${roomTypeImages.length}',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

        // Image caption
        if (roomTypeImages.isNotEmpty &&
            roomTypeImages[currentImageIndex].caption != null &&
            roomTypeImages[currentImageIndex].caption!.isNotEmpty)
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
                roomTypeImages[currentImageIndex].caption!,
                style: TextStyle(color: Colors.white, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildRoomTypeHeader(bool isRoomSuitable) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                widget.roomType.name,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isRoomSuitable
                    ? Colors.orange.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isRoomSuitable ? Colors.orange : Colors.red,
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    isRoomSuitable
                        ? (widget.calculatedPrice != null
                              ? _formatPrice(widget.calculatedPrice!)
                              : _formatPrice(widget.roomType.basePrice))
                        : 'Không phù hợp để đặt',
                    style: TextStyle(
                      fontSize: isRoomSuitable ? 20 : 16,
                      fontWeight: FontWeight.bold,
                      color: isRoomSuitable ? Colors.orange : Colors.red,
                    ),
                  ),
                  if (isRoomSuitable && widget.calculatedPrice != null) ...[
                    Text(
                      'Tổng cộng',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  ] else if (isRoomSuitable) ...[
                    Text(
                      'mỗi đêm',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),

        if (widget.roomType.description != null &&
            widget.roomType.description!.isNotEmpty) ...[
          SizedBox(height: 16),
          Text(
            widget.roomType.description!,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
              height: 1.5,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRoomSuitabilityInfo(bool isRoomSuitable) {
    if (!isRoomSuitable) {
      return Container(
        width: double.infinity,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning, color: Colors.red, size: 24),
                SizedBox(width: 8),
                Text(
                  'Không phù hợp',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Loại phòng này không đáp ứng yêu cầu tìm kiếm của bạn',
              style: TextStyle(fontSize: 14, color: Colors.red[700]),
            ),
          ],
        ),
      );
    }

    if (widget.calculatedRoom != null) {
      return Container(
        width: double.infinity,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 24),
                SizedBox(width: 8),
                Text(
                  'Phù hợp với yêu cầu',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Cần ${widget.calculatedRoom!['requiredRooms']} phòng (${widget.calculatedRoom!['totalCapacity']} khách)',
              style: TextStyle(
                fontSize: 16,
                color: Colors.green[700],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return SizedBox.shrink();
  }

  Widget _buildPriceBredown() {
    if (widget.calculatedRoom == null || widget.calculatedPrice == null) {
      return SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chi tiết giá:',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.blue[700],
            ),
          ),
          SizedBox(height: 12),
          _buildPriceRow(
            'Giá gốc',
            '${_formatPrice(widget.roomType.basePrice)} / đêm',
          ),
          _buildPriceRow(
            'Số phòng',
            '${widget.calculatedRoom!['requiredRooms']}',
          ),
          if (widget.seasonalPricings != null &&
              widget.seasonalPricings!.isNotEmpty) ...[
            _buildPriceRow('Áp dụng', 'Giá theo mùa'),
          ],
          Divider(color: Colors.blue[300]),
          _buildPriceRow(
            'Tổng cộng',
            _formatPrice(widget.calculatedPrice!),
            isTotal: true,
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              color: Colors.blue[600],
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              color: Colors.blue[700],
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSeasonalPricingInfo() {
    if (widget.seasonalPricings == null || widget.seasonalPricings!.isEmpty) {
      return SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.purple.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.purple.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_month, color: Colors.purple[700], size: 20),
              SizedBox(width: 8),
              Text(
                'Giá theo mùa',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.purple[700],
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          ...widget.seasonalPricings!.map(
            (pricing) => Container(
              margin: EdgeInsets.only(bottom: 8),
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.purple.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pricing.name,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.purple[800],
                    ),
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.trending_up, size: 16, color: Colors.orange),
                      SizedBox(width: 4),
                      Text(
                        pricing.priceDescription,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.orange[700],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.date_range, size: 16, color: Colors.grey[600]),
                      SizedBox(width: 4),
                      Text(
                        '${DateFormat('dd/MM/yyyy').format(pricing.startDate)} - ${DateFormat('dd/MM/yyyy').format(pricing.endDate)}',
                        style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoomTypeDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Thông tin chi tiết',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        SizedBox(height: 16),

        Container(
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
            children: [
              _buildDetailRow(
                Icons.people,
                'Số khách tối đa',
                '${widget.roomType.maxOccupancy} khách',
                Colors.blue,
              ),
              _buildDivider(),
              _buildDetailRow(
                Icons.hotel,
                'Số phòng có sẵn',
                '${widget.roomType.numberOfRooms} phòng',
                Colors.green,
              ),
              if (widget.roomType.areaSqm != null) ...[
                _buildDivider(),
                _buildDetailRow(
                  Icons.square_foot,
                  'Diện tích',
                  '${widget.roomType.areaSqm!.toStringAsFixed(0)} m²',
                  Colors.purple,
                ),
              ],
              if (widget.roomType.bedType != null &&
                  widget.roomType.bedType!.isNotEmpty) ...[
                _buildDivider(),
                _buildDetailRow(
                  Icons.bed,
                  'Loại giường',
                  widget.roomType.bedType!,
                  Colors.orange,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value,
    Color iconColor,
  ) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
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
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.black87,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(color: Colors.grey[200], thickness: 1, height: 20);
  }

  Widget _buildBookingButton(bool isRoomSuitable) {
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
                  isRoomSuitable ? 'Giá phòng' : 'Không thể đặt',
                  style: TextStyle(
                    fontSize: 12,
                    color: isRoomSuitable ? Colors.grey[600] : Colors.red[600],
                  ),
                ),
                Text(
                  isRoomSuitable
                      ? (widget.calculatedPrice != null
                            ? _formatPrice(widget.calculatedPrice!)
                            : _formatPrice(widget.roomType.basePrice))
                      : 'Không phù hợp',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isRoomSuitable ? Colors.orange : Colors.red,
                  ),
                ),
                if (isRoomSuitable) ...[
                  Text(
                    widget.calculatedPrice != null ? 'tổng cộng' : 'mỗi đêm',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ],
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: isRoomSuitable ? () => _showBookingDialog() : null,
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

  void _showBookingDialog() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingDetailScreen(
          hotel: widget.hotel, // Truyền hotel sang đây
          roomType: widget.roomType,
          calculatedRoom: widget.calculatedRoom,
          calculatedPrice: widget.calculatedPrice,
          seasonalPricings: widget.seasonalPricings,
          searchParams: widget.searchParams,
        ),
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VNĐ';
  }
}
