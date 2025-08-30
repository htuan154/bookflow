import 'package:flutter/material.dart';
import '../../../classes/hotel_model.dart';
import '../../../classes/room_type_model.dart';
import '../../../classes/room_type_image_model.dart';
import '../../../services/hotel_service.dart';
import 'room_type_detail_screen.dart';

class BookingScreen extends StatefulWidget {
  final Hotel hotel;

  const BookingScreen({Key? key, required this.hotel}) : super(key: key);

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  List<RoomType> roomTypes = [];
  Map<String, RoomTypeImage?> roomTypeThumbnails = {};
  bool isLoadingRoomTypes = false;
  bool isLoadingThumbnails = false;

  @override
  void initState() {
    super.initState();
    _loadRoomTypes();
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
                          color: Colors.orange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _formatPrice(roomType.basePrice),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange,
                          ),
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
                ],
              ),
            ),
          ],
        ),
      ),
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
