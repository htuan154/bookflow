import 'package:flutter/material.dart';
import '../../../classes/room_type_model.dart';
import '../../../classes/room_type_image_model.dart';
import '../../../services/hotel_service.dart';

class RoomTypeDetailScreen extends StatefulWidget {
  final RoomType roomType;

  const RoomTypeDetailScreen({Key? key, required this.roomType}) : super(key: key);

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
      final result = await HotelService().getRoomTypeImages(widget.roomType.roomTypeId!);
      
      if (result['success'] && result['data'] != null) {
        setState(() {
          roomTypeImages = (result['data'] as List)
              .map((json) => RoomTypeImage.fromJson({
                    'image_id': json['imageId'] ?? json['image_id'],
                    'room_type_id': json['roomTypeId'] ?? json['room_type_id'],
                    'image_url': json['imageUrl'] ?? json['image_url'],
                    'caption': json['caption'],
                    'is_thumbnail': json['isThumbnail'] ?? json['is_thumbnail'] ?? false,
                    'uploaded_at': json['uploadedAt'] ?? json['uploaded_at'],
                  }))
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
                  _buildRoomTypeHeader(),
                  SizedBox(height: 24),
                  _buildRoomTypeDetails(),
                  //SizedBox(height: 100), // Space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBookingButton(),
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
      flexibleSpace: FlexibleSpaceBar(
        background: _buildImageSlider(),
      ),
    );
  }

  Widget _buildImageSlider() {
    if (isLoadingImages) {
      return Container(
        color: Colors.grey[200],
        child: Center(
          child: CircularProgressIndicator(color: Colors.orange),
        ),
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
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[500],
                ),
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
            return Container(
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
                          Icon(Icons.broken_image, size: 64, color: Colors.grey[400]),
                          SizedBox(height: 8),
                          Text('Lỗi tải ảnh', style: TextStyle(color: Colors.grey[500])),
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

  Widget _buildRoomTypeHeader() {
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
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _formatPrice(widget.roomType.basePrice),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        
        if (widget.roomType.description != null && widget.roomType.description!.isNotEmpty) ...[
          SizedBox(height: 12),
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
              if (widget.roomType.bedType != null && widget.roomType.bedType!.isNotEmpty) ...[
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

  Widget _buildDetailRow(IconData icon, String label, String value, Color iconColor) {
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
    return Divider(
      color: Colors.grey[200],
      thickness: 1,
      height: 20,
    );
  }

  Widget _buildBookingButton() {
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
                  'Giá phòng',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                Text(
                  _formatPrice(widget.roomType.basePrice),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
                Text(
                  'mỗi đêm',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () => _showBookingDialog(),
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
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Đặt phòng'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Loại phòng: ${widget.roomType.name}'),
            SizedBox(height: 8),
            Text('Giá: ${_formatPrice(widget.roomType.basePrice)}/đêm'),
            SizedBox(height: 16),
            Text(
              'Tính năng đặt phòng sẽ được phát triển trong tương lai.',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
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

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VNĐ';
  }
}