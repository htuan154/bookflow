import 'package:flutter/material.dart';
import '../../../classes/hotel_model.dart';
import '../../../classes/room_type_model.dart';
import '../../../classes/room_type_image_model.dart';
import '../../../classes/roomtypeavailability_model.dart'; // Thêm import này
import '../../../classes/season_pricing_model.dart'; // Thêm import này
import '../../../services/hotel_service.dart';
import 'room_type_detail_screen.dart';

class BookingScreen extends StatefulWidget {
  final Hotel hotel;
  final List<RoomTypeAvailability>? suitableRoomsForHotel; // Thêm parameter này
  final Map<String, dynamic>? searchParams; // Thêm parameter này

  const BookingScreen({
    Key? key,
    required this.hotel,
    this.suitableRoomsForHotel, // Thêm parameter này
    this.searchParams, // Thêm parameter này
  }) : super(key: key);

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  List<RoomType> roomTypes = [];
  Map<String, RoomTypeImage?> roomTypeThumbnails = {};
  bool isLoadingRoomTypes = false;
  bool isLoadingThumbnails = false;
  Map<String, List<SeasonalPricing>> seasonalPricingsByRoomType = {};
  bool isLoadingSeasonalPricings = false;

  List<Map<String, dynamic>> calculatedRooms =
      []; // Mảng chứa roomTypeId và số phòng
  Map<String, double> calculatedPrices = {}; // Mảng chứa giá đã tính cho từng roomTypeId

  @override
  void initState() {
    super.initState();
    _loadRoomTypes();
    _loadSeasonalPricingsForSuitableRooms().then((_) {
      _calculateRequiredRooms();
      _calculatePricesForAllRoomTypes(); // Tính giá sau khi load seasonal pricing
    });

    // Debug prints for the parameters
    print('=== BookingScreen Debug ===');
    print('suitableRoomsForHotel: ${widget.suitableRoomsForHotel}');
    print(
      'suitableRoomsForHotel length: ${widget.suitableRoomsForHotel?.length ?? 0}',
    );
    print('searchParams: ${widget.searchParams}');
    print('===========================');
  }

  void _calculatePricesForAllRoomTypes() {
    if (widget.searchParams == null) return;

    // Lấy ngày check-in và check-out từ searchParams
    final String checkInDateStr = widget.searchParams!['checkInDate'] ?? '';
    final String checkOutDateStr = widget.searchParams!['checkOutDate'] ?? '';

    if (checkInDateStr.isEmpty || checkOutDateStr.isEmpty) return;

    final DateTime checkInDate = DateTime.parse(checkInDateStr);
    final DateTime checkOutDate = DateTime.parse(checkOutDateStr);

    print('=== TÍNH GIÁ CHO TẤT CẢ LOẠI PHÒNG ===');
    print('Check-in: ${checkInDate.toLocal().toString().split(' ')[0]}');
    print('Check-out: ${checkOutDate.toLocal().toString().split(' ')[0]}');

    for (var calculatedRoom in calculatedRooms) {
      final String roomTypeId = calculatedRoom['roomTypeId'];
      final int requiredRooms = calculatedRoom['requiredRooms'];

      // Tìm roomType từ danh sách để lấy basePrice
      final roomType = roomTypes.firstWhere(
        (rt) => rt.roomTypeId == roomTypeId,
        orElse: () => RoomType(
          roomTypeId: roomTypeId,
          hotelId: '',
          name: '',
          basePrice: 0,
          maxOccupancy: 1,
          numberOfRooms: 0,
        ),
      );

      final double basePrice = roomType.basePrice;
      final List<SeasonalPricing> seasonalPricings = seasonalPricingsByRoomType[roomTypeId] ?? [];

      final double totalPrice = _calculatePriceForRoomType(
        checkInDate,
        checkOutDate,
        basePrice,
        requiredRooms,
        seasonalPricings,
      );

      calculatedPrices[roomTypeId] = totalPrice;

      print('---');
      print('RoomTypeID: $roomTypeId');
      print('Tên phòng: ${roomType.name}');
      print('Giá gốc: ${_formatPrice(basePrice)} / đêm');
      print('Số phòng cần: $requiredRooms');
      print('Tổng giá: ${_formatPrice(totalPrice)}');
    }

    print('======================================');
    setState(() {}); // Cập nhật UI
  }

  double _calculatePriceForRoomType(
    DateTime checkInDate,
    DateTime checkOutDate,
    double basePrice,
    int requiredRooms,
    List<SeasonalPricing> seasonalPricings,
  ) {
    // Tính số ngày ở
    final int totalDays = checkOutDate.difference(checkInDate).inDays;
    if (totalDays <= 0) return 0;

    double totalPrice = 0;

    // Duyệt qua từng ngày trong khoảng thời gian
    for (int dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      final DateTime currentDate = checkInDate.add(Duration(days: dayOffset));

      // Kiểm tra xem ngày hiện tại có nằm trong seasonal pricing nào không
      SeasonalPricing? applicableSeasonalPricing;

      for (var pricing in seasonalPricings) {
        if (pricing.isDateInRange(currentDate)) {
          applicableSeasonalPricing = pricing;
          break; // Lấy seasonal pricing đầu tiên phù hợp
        }
      }

      double dailyPrice;
      if (applicableSeasonalPricing != null) {
        // Có seasonal pricing áp dụng
        dailyPrice = basePrice * applicableSeasonalPricing.priceModifier;
        print('  ${currentDate.toLocal().toString().split(' ')[0]}: ${_formatPrice(basePrice)} x ${applicableSeasonalPricing.priceModifier} (${applicableSeasonalPricing.name}) = ${_formatPrice(dailyPrice)}');
      } else {
        // Không có seasonal pricing, dùng giá gốc
        dailyPrice = basePrice;
        print('  ${currentDate.toLocal().toString().split(' ')[0]}: ${_formatPrice(basePrice)} (giá thường)');
      }

      totalPrice += dailyPrice;
    }

    // Nhân với số phòng cần thiết
    final double finalPrice = totalPrice * requiredRooms;

    print('  Tổng ${totalDays} ngày x ${requiredRooms} phòng = ${_formatPrice(finalPrice)}');

    return finalPrice;
  }

  Future<void> _loadRoomTypes() async {
    setState(() {
      isLoadingRoomTypes = true;
    });

    try {
      final result = await HotelService().getRoomTypesByHotelId(
        widget.hotel.hotelId,
      );

      if (result['success'] && result['data'] != null) {
        setState(() {
          roomTypes = (result['data'] as List)
              .map((json) => RoomType.fromJson(json))
              .toList();
        });

        // Load thumbnails cho tất cả room types
        _loadThumbnailsForAllRoomTypes();
      } else {
        setState(() {
          roomTypes = [];
        });
        _showErrorSnackBar(
          result['message'] ?? 'Không thể tải danh sách phòng',
        );
      }
    } catch (e) {
      setState(() {
        roomTypes = [];
      });
      _showErrorSnackBar('Lỗi kết nối: $e');
    } finally {
      setState(() {
        isLoadingRoomTypes = false;
      });
    }
  }

  Future<void> _loadThumbnailsForAllRoomTypes() async {
    setState(() {
      isLoadingThumbnails = true;
    });

    for (RoomType roomType in roomTypes) {
      if (roomType.roomTypeId != null) {
        try {
          final result = await HotelService().getRoomTypeThumbnail(
            roomType.roomTypeId!,
          );
          if (result['success'] && result['data'] != null) {
            setState(() {
              roomTypeThumbnails[roomType.roomTypeId!] = RoomTypeImage.fromJson(
                {
                  'image_id':
                      result['data']['imageId'] ?? result['data']['image_id'],
                  'room_type_id':
                      result['data']['roomTypeId'] ??
                      result['data']['room_type_id'],
                  'image_url':
                      result['data']['imageUrl'] ?? result['data']['image_url'],
                  'caption': result['data']['caption'],
                  'is_thumbnail':
                      result['data']['isThumbnail'] ??
                      result['data']['is_thumbnail'] ??
                      true,
                  'uploaded_at':
                      result['data']['uploadedAt'] ??
                      result['data']['uploaded_at'],
                },
              );
            });
          } else {
            setState(() {
              roomTypeThumbnails[roomType.roomTypeId!] = null;
            });
          }
        } catch (e) {
          print('Error loading thumbnail for ${roomType.roomTypeId}: $e');
          setState(() {
            roomTypeThumbnails[roomType.roomTypeId!] = null;
          });
        }
      }
    }

    setState(() {
      isLoadingThumbnails = false;
    });
  }

  Future<void> _loadSeasonalPricingsForSuitableRooms() async {
    if (widget.suitableRoomsForHotel == null) return;
    setState(() {
      isLoadingSeasonalPricings = true;
    });

    for (var room in widget.suitableRoomsForHotel!) {
      final roomTypeId = room.roomTypeId;
      if (roomTypeId != null) {
        try {
          final result = await HotelService().getSeasonalPricingsForRoomType(
            roomTypeId,
          );
          if (result['success'] && result['data'] != null) {
            final List<SeasonalPricing> pricings = (result['data'] as List)
                .map((json) => SeasonalPricing.fromJson(json))
                .toList();
            setState(() {
              seasonalPricingsByRoomType[roomTypeId] = pricings;
            });
          } else {
            setState(() {
              seasonalPricingsByRoomType[roomTypeId] = [];
            });
          }
        } catch (e) {
          setState(() {
            seasonalPricingsByRoomType[roomTypeId] = [];
          });
        }
      }
    }

    setState(() {
      isLoadingSeasonalPricings = false;
    });
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ),
    );
  }

  void _onRoomTypeTap(RoomType roomType) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RoomTypeDetailScreen(roomType: roomType),
      ),
    );
  }

  void _calculateRequiredRooms() {
    if (widget.suitableRoomsForHotel == null || widget.searchParams == null) {
      print('=== Không có dữ liệu để tính toán ===');
      return;
    }

    // Lấy số khách và số phòng từ searchParams
    final int totalGuests = widget.searchParams!['guestCount'] ?? 1;
    final int requestedRooms = widget.searchParams!['roomCount'] ?? 1;

    print('=== THÔNG TIN TÌM KIẾM ===');
    print('Tổng số khách: $totalGuests');
    print('Số phòng khách chọn: $requestedRooms');
    print('=============================');

    calculatedRooms.clear();

    for (var suitableRoom in widget.suitableRoomsForHotel!) {
      final roomTypeId = suitableRoom.roomTypeId;
      final maxOccupancy = suitableRoom.maxOccupancy ?? 1;

      if (roomTypeId != null) {
        // Tính số phòng cần thiết
        int requiredRooms;

        // Kiểm tra xem số phòng khách chọn * max_occupancy có đủ chứa số khách không
        final totalCapacityWithRequestedRooms = maxOccupancy * requestedRooms;

        if (totalCapacityWithRequestedRooms >= totalGuests) {
          // Đủ chỗ với số phòng khách chọn
          requiredRooms = requestedRooms;
        } else {
          // Không đủ chỗ, tính số phòng tối thiểu cần thiết
          requiredRooms = (totalGuests / maxOccupancy).ceil();
        }

        calculatedRooms.add({
          'roomTypeId': roomTypeId,
          'requiredRooms': requiredRooms,
          'maxOccupancy': maxOccupancy,
          'totalCapacity': maxOccupancy * requiredRooms,
        });
      }
    }

    // Debug: In ra mảng kết quả
    print('=== MẢNG KẾT QUẢ TÍNH TOÁN ===');
    for (var room in calculatedRooms) {
      print('RoomTypeID: ${room['roomTypeId']}');
      print('Số phòng cần thiết: ${room['requiredRooms']}');
      print('Max occupancy: ${room['maxOccupancy']}');
      print('Tổng sức chứa: ${room['totalCapacity']}');
      print('---');
    }
    print('================================');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Đặt phòng'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          _buildHotelHeader(),
          Expanded(child: _buildRoomTypesList()),
        ],
      ),
    );
  }

  Widget _buildHotelHeader() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
        children: [
          Text(
            widget.hotel.name,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
              SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${widget.hotel.address}, ${widget.hotel.city}',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Row(
            children: [
              ...List.generate(5, (index) {
                return Icon(
                  index < (widget.hotel.starRating ?? 0)
                      ? Icons.star
                      : Icons.star_border,
                  color: Colors.orange,
                  size: 16,
                );
              }),
              SizedBox(width: 8),
              Text(
                '(${widget.hotel.totalReviews} đánh giá)',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRoomTypesList() {
    if (isLoadingRoomTypes) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Colors.orange),
            SizedBox(height: 16),
            Text('Đang tải danh sách phòng...'),
          ],
        ),
      );
    }

    if (roomTypes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hotel_outlined, size: 64, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              'Không có phòng nào',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Khách sạn này hiện chưa có loại phòng nào',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: EdgeInsets.all(16),
      itemCount: roomTypes.length,
      separatorBuilder: (_, __) => SizedBox(height: 16),
      itemBuilder: (context, index) {
        final roomType = roomTypes[index];
        final thumbnail = roomType.roomTypeId != null
            ? roomTypeThumbnails[roomType.roomTypeId!]
            : null;
        return _buildRoomTypeCard(roomType, thumbnail);
      },
    );
  }

  Widget _buildRoomTypeCard(RoomType roomType, RoomTypeImage? thumbnail) {
    final seasonalPricings =
        seasonalPricingsByRoomType[roomType.roomTypeId] ?? [];

    // Kiểm tra xem roomType này có trong calculatedRooms không
    final calculatedRoom = calculatedRooms.firstWhere(
      (room) => room['roomTypeId'] == roomType.roomTypeId,
      orElse: () => {},
    );
    final bool isRoomSuitable = calculatedRoom.isNotEmpty;

    // Lấy giá đã tính (nếu có)
    final double? calculatedPrice = calculatedPrices[roomType.roomTypeId];

    return InkWell(
      onTap: () => _onRoomTypeTap(roomType),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hình ảnh thumbnail
            ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              child: Container(
                height: 200,
                width: double.infinity,
                child: _buildRoomImage(thumbnail),
              ),
            ),

            // Thông tin phòng
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tên phòng và giá
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          roomType.name,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isRoomSuitable
                              ? Colors.orange.withOpacity(0.1)
                              : Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              isRoomSuitable
                                  ? (calculatedPrice != null
                                      ? _formatPrice(calculatedPrice)
                                      : _formatPrice(roomType.basePrice))
                                  : 'Không phù hợp để đặt',
                              style: TextStyle(
                                fontSize: isRoomSuitable ? 16 : 14,
                                fontWeight: FontWeight.bold,
                                color: isRoomSuitable ? Colors.orange : Colors.red,
                              ),
                            ),
                            if (isRoomSuitable && calculatedPrice != null) ...[
                              Text(
                                'Tổng cộng',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),

                  if (roomType.description != null &&
                      roomType.description!.isNotEmpty) ...[
                    SizedBox(height: 8),
                    Text(
                      roomType.description!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  SizedBox(height: 12),

                  // Thông tin chi tiết
                  Row(
                    children: [
                      _buildInfoChip(
                        Icons.people,
                        '${roomType.maxOccupancy} khách',
                      ),
                      SizedBox(width: 8),
                      _buildInfoChip(
                        Icons.hotel,
                        '${roomType.numberOfRooms} phòng',
                      ),
                      if (roomType.areaSqm != null) ...[
                        SizedBox(width: 8),
                        _buildInfoChip(
                          Icons.square_foot,
                          '${roomType.areaSqm!.toStringAsFixed(0)} m²',
                        ),
                      ],
                    ],
                  ),

                  // Hiển thị thông tin giá chi tiết nếu phù hợp
                  if (isRoomSuitable && calculatedPrice != null) ...[
                    SizedBox(height: 12),
                    Container(
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Chi tiết giá:',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[700],
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Giá gốc: ${_formatPrice(roomType.basePrice)} / đêm',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[600],
                            ),
                          ),
                          Text(
                            'Số phòng: ${calculatedRoom['requiredRooms']}',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[600],
                            ),
                          ),
                          if (seasonalPricings.isNotEmpty) ...[
                            Text(
                              '(Đã áp dụng giá theo mùa)',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.blue[600],
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ] else if (isRoomSuitable) ...[
                    SizedBox(height: 12),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Cần ${calculatedRoom['requiredRooms']} phòng (${calculatedRoom['totalCapacity']} khách)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.green[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ] else ...[
                    SizedBox(height: 12),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Loại phòng này không đáp ứng yêu cầu tìm kiếm của bạn',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],

                  if (roomType.bedType != null &&
                      roomType.bedType!.isNotEmpty) ...[
                    SizedBox(height: 12),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        roomType.bedType!,
                        style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                      ),
                    ),
                  ],

                  if (seasonalPricings.isNotEmpty && isRoomSuitable) ...[
                    SizedBox(height: 8),
                    Text(
                      'Giá theo mùa:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    ...seasonalPricings.map(
                      (pricing) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2.0),
                        child: Text(
                          '${pricing.name}: ${pricing.priceDescription} '
                          '(${pricing.startDate.toLocal().toString().split(' ')[0]} '
                          '- ${pricing.endDate.toLocal().toString().split(' ')[0]})',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[700],
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      )
      );
    }

  Widget _buildRoomImage(RoomTypeImage? thumbnail) {
    if (isLoadingThumbnails) {
      return Container(
        color: Colors.grey[200],
        child: Center(
          child: CircularProgressIndicator(
            color: Colors.orange,
            strokeWidth: 2,
          ),
        ),
      );
    }

    if (thumbnail?.imageUrl != null && thumbnail!.imageUrl.isNotEmpty) {
      return Image.network(
        thumbnail.imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildPlaceholderImage();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: Colors.grey[200],
            child: Center(
              child: CircularProgressIndicator(
                color: Colors.orange,
                strokeWidth: 2,
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                    : null,
              ),
            ),
          );
        },
      );
    }

    return _buildPlaceholderImage();
  }

  Widget _buildPlaceholderImage() {
    return Container(
      color: Colors.grey[200],
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bed_outlined, size: 40, color: Colors.grey[400]),
            SizedBox(height: 8),
            Text(
              'Không có hình ảnh',
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.blue[700]),
          SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.blue[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VNĐ';
  }
}
