import 'package:flutter/material.dart';
import '../../services/review_service.dart';
import '../../services/token_service.dart';
import '../../services/user_service.dart';

class ReviewFormScreen extends StatefulWidget {
  final String bookingId;
  final String hotelId;

  const ReviewFormScreen({
    super.key,
    required this.bookingId,
    required this.hotelId,
  });

  @override
  State<ReviewFormScreen> createState() => _ReviewFormScreenState();
}

class _ReviewFormScreenState extends State<ReviewFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _commentController = TextEditingController();
  final _imageUrlController = TextEditingController();
  
  bool _isSubmitting = false;
  
  // Rating values
  double _cleanlinessRating = 5;
  double _comfortRating = 5;
  double _serviceRating = 5;
  double _locationRating = 5;
  double _valueRating = 5;
  
  // Image URLs list
  List<String> _imageUrls = [];

  @override
  void dispose() {
    _commentController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Viết đánh giá',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        elevation: 1,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            // Header
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(Icons.rate_review, size: 48, color: Colors.orange),
                  SizedBox(height: 8),
                  Text(
                    'Chia sẻ trải nghiệm của bạn',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Đánh giá của bạn giúp người khác lựa chọn tốt hơn',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            SizedBox(height: 24),

            // Rating sections
            _buildRatingSection(
              'Độ sạch sẽ',
              Icons.cleaning_services,
              _cleanlinessRating,
              (value) => setState(() => _cleanlinessRating = value),
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Tiện nghi',
              Icons.bed,
              _comfortRating,
              (value) => setState(() => _comfortRating = value),
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Dịch vụ',
              Icons.room_service,
              _serviceRating,
              (value) => setState(() => _serviceRating = value),
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Vị trí',
              Icons.location_on,
              _locationRating,
              (value) => setState(() => _locationRating = value),
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Giá trị',
              Icons.attach_money,
              _valueRating,
              (value) => setState(() => _valueRating = value),
            ),
            SizedBox(height: 24),

            // Comment section
            Text(
              'Nhận xét của bạn',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            TextFormField(
              controller: _commentController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Chia sẻ trải nghiệm của bạn về khách sạn này...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: EdgeInsets.all(16),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Vui lòng nhập nhận xét';
                }
                if (value.trim().length < 10) {
                  return 'Nhận xét phải có ít nhất 10 ký tự';
                }
                return null;
              },
            ),
            SizedBox(height: 24),

            // Image URLs section
            Text(
              'Thêm hình ảnh (tùy chọn)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            
            // Input for adding image URL
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _imageUrlController,
                    decoration: InputDecoration(
                      hintText: 'Nhập URL hình ảnh',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
                SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _addImageUrl,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Icon(Icons.add),
                ),
              ],
            ),
            SizedBox(height: 12),

            // Display added image URLs
            if (_imageUrls.isNotEmpty) ...[
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hình ảnh đã thêm (${_imageUrls.length})',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 8),
                    ..._imageUrls.asMap().entries.map((entry) {
                      final index = entry.key;
                      final url = entry.value;
                      return Container(
                        margin: EdgeInsets.only(bottom: 8),
                        padding: EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.image, color: Colors.orange, size: 20),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                url,
                                style: TextStyle(fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red, size: 20),
                              onPressed: () => _removeImageUrl(index),
                              padding: EdgeInsets.zero,
                              constraints: BoxConstraints(),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                ),
              ),
              SizedBox(height: 24),
            ],

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSubmitting
                    ? SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'Gửi đánh giá',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingSection(
    String title,
    IconData icon,
    double rating,
    ValueChanged<double> onChanged,
  ) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.orange, size: 24),
              SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Spacer(),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange[100],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${rating.toInt()}/5',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange[800],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Slider(
            value: rating,
            min: 1,
            max: 5,
            divisions: 4,
            activeColor: Colors.orange,
            inactiveColor: Colors.grey[300],
            onChanged: onChanged,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(5, (index) {
              return Icon(
                Icons.star,
                size: 20,
                color: index < rating ? Colors.orange : Colors.grey[300],
              );
            }),
          ),
        ],
      ),
    );
  }

  void _addImageUrl() {
    final url = _imageUrlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng nhập URL hình ảnh'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Simple URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('URL không hợp lệ (phải bắt đầu bằng http:// hoặc https://)'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _imageUrls.add(url);
      _imageUrlController.clear();
    });
  }

  void _removeImageUrl(int index) {
    setState(() {
      _imageUrls.removeAt(index);
    });
  }

  Future<void> _submitReview() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      // Get user info
      final user = await UserService.getUser();
      if (user == null || user.userId == null) {
        throw Exception('Không tìm thấy thông tin người dùng');
      }

      // Get token
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Vui lòng đăng nhập lại');
      }

      // Prepare review data
      final reviewData = {
        'user_id': user.userId,
        'hotel_id': widget.hotelId,
        'booking_id': widget.bookingId,
        'comment': _commentController.text.trim(),
        'cleanliness_rating': _cleanlinessRating.toInt(),
        'comfort_rating': _comfortRating.toInt(),
        'service_rating': _serviceRating.toInt(),
        'location_rating': _locationRating.toInt(),
        'value_rating': _valueRating.toInt(),
      };

      print('📤 Submitting review: $reviewData');

      // Submit review
      final result = await ReviewService().createReview(reviewData, token);

      print('📦 Review result: $result');

      if (result['success']) {
        // If there are images, upload them
        if (_imageUrls.isNotEmpty && result['data'] != null) {
          final reviewId = result['data']['reviewId'] ?? result['data']['review_id'];
          if (reviewId != null) {
            print('📤 Uploading ${_imageUrls.length} images for review $reviewId');
            
            final imageResult = await ReviewImageService().uploadReviewImages(
              reviewId,
              _imageUrls,
              token,
            );
            
            print('📦 Image upload result: $imageResult');
            
            if (!imageResult['success']) {
              print('⚠️ Image upload failed: ${imageResult['message']}');
              // Don't block review submission if image upload fails
            }
          }
        }

        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Đánh giá đã được gửi thành công!'),
              backgroundColor: Colors.green,
            ),
          );

          // Go back to review list
          Navigator.pop(context, true); // Return true to indicate success
        }
      } else {
        throw Exception(result['message'] ?? 'Không thể gửi đánh giá');
      }
    } catch (e) {
      print('❌ Error submitting review: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
}
