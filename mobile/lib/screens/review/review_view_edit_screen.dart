import 'package:flutter/material.dart';
import '../../services/review_service.dart';
import '../../services/token_service.dart';

class ReviewViewEditScreen extends StatefulWidget {
  final String bookingId;
  final String hotelId;
  final Map<String, dynamic> existingReview;

  const ReviewViewEditScreen({
    super.key,
    required this.bookingId,
    required this.hotelId,
    required this.existingReview,
  });

  @override
  State<ReviewViewEditScreen> createState() => _ReviewViewEditScreenState();
}

class _ReviewViewEditScreenState extends State<ReviewViewEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _commentController = TextEditingController();
  final _imageUrlController = TextEditingController();
  
  bool _isSubmitting = false;
  bool _isLoadingImages = true;
  bool _hasChanges = false;
  
  // Rating values
  late double _cleanlinessRating;
  late double _comfortRating;
  late double _serviceRating;
  late double _locationRating;
  late double _valueRating;
  
  // Original values for comparison
  late double _originalCleanlinessRating;
  late double _originalComfortRating;
  late double _originalServiceRating;
  late double _originalLocationRating;
  late double _originalValueRating;
  late String _originalComment;
  
  // Image URLs list
  List<Map<String, dynamic>> _existingImages = []; // {imageId, imageUrl}
  List<String> _newImageUrls = [];
  List<String> _imagesToDelete = []; // imageIds to delete

  @override
  void initState() {
    super.initState();
    _initializeReviewData();
    _loadReviewImages();
  }

  void _initializeReviewData() {
    final review = widget.existingReview;
    
    _cleanlinessRating = (review['cleanlinessRating'] ?? review['cleanliness_rating'] ?? 5).toDouble();
    _comfortRating = (review['comfortRating'] ?? review['comfort_rating'] ?? 5).toDouble();
    _serviceRating = (review['serviceRating'] ?? review['service_rating'] ?? 5).toDouble();
    _locationRating = (review['locationRating'] ?? review['location_rating'] ?? 5).toDouble();
    _valueRating = (review['valueRating'] ?? review['value_rating'] ?? 5).toDouble();
    
    _originalCleanlinessRating = _cleanlinessRating;
    _originalComfortRating = _comfortRating;
    _originalServiceRating = _serviceRating;
    _originalLocationRating = _locationRating;
    _originalValueRating = _valueRating;
    
    _originalComment = review['comment'] ?? '';
    _commentController.text = _originalComment;
  }

  Future<void> _loadReviewImages() async {
    setState(() => _isLoadingImages = true);
    
    try {
      final reviewId = widget.existingReview['reviewId'] ?? widget.existingReview['review_id'];
      if (reviewId == null) {
        setState(() => _isLoadingImages = false);
        return;
      }
      
      final token = await TokenService.getToken();
      if (token == null) {
        setState(() => _isLoadingImages = false);
        return;
      }
      
      final result = await ReviewImageService().getReviewImages(reviewId, token);
      
      if (result['success'] && result['data'] != null) {
        setState(() {
          _existingImages = (result['data'] as List).map((img) => {
            'imageId': img['imageId'] ?? img['image_id'],
            'imageUrl': img['imageUrl'] ?? img['image_url'],
          }).toList();
          _isLoadingImages = false;
        });
      } else {
        setState(() => _isLoadingImages = false);
      }
    } catch (e) {
      print('Error loading review images: $e');
      setState(() => _isLoadingImages = false);
    }
  }

  void _checkForChanges() {
    final hasRatingChanges = 
      _cleanlinessRating != _originalCleanlinessRating ||
      _comfortRating != _originalComfortRating ||
      _serviceRating != _originalServiceRating ||
      _locationRating != _originalLocationRating ||
      _valueRating != _originalValueRating;
    
    final hasCommentChanges = _commentController.text.trim() != _originalComment;
    final hasImageChanges = _newImageUrls.isNotEmpty || _imagesToDelete.isNotEmpty;
    
    setState(() {
      _hasChanges = hasRatingChanges || hasCommentChanges || hasImageChanges;
    });
  }

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
          'Đánh giá của bạn',
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
                    'Xem và chỉnh sửa đánh giá',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Thay đổi đánh giá của bạn nếu cần',
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
              (value) {
                setState(() => _cleanlinessRating = value);
                _checkForChanges();
              },
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Tiện nghi',
              Icons.bed,
              _comfortRating,
              (value) {
                setState(() => _comfortRating = value);
                _checkForChanges();
              },
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Dịch vụ',
              Icons.room_service,
              _serviceRating,
              (value) {
                setState(() => _serviceRating = value);
                _checkForChanges();
              },
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Vị trí',
              Icons.location_on,
              _locationRating,
              (value) {
                setState(() => _locationRating = value);
                _checkForChanges();
              },
            ),
            SizedBox(height: 16),
            
            _buildRatingSection(
              'Giá trị',
              Icons.attach_money,
              _valueRating,
              (value) {
                setState(() => _valueRating = value);
                _checkForChanges();
              },
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
              onChanged: (_) => _checkForChanges(),
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

            // Existing images section
            if (_isLoadingImages)
              Center(child: CircularProgressIndicator())
            else if (_existingImages.isNotEmpty) ...[
              Text(
                'Hình ảnh hiện tại (${_existingImages.length})',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _existingImages.map((img) {
                    final imageId = img['imageId'];
                    final imageUrl = img['imageUrl'];
                    final isMarkedForDeletion = _imagesToDelete.contains(imageId);
                    
                    return Container(
                      margin: EdgeInsets.only(bottom: 8),
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isMarkedForDeletion ? Colors.red[50] : Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isMarkedForDeletion ? Colors.red[300]! : Colors.grey[300]!
                        ),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: Image.network(
                              imageUrl,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              errorBuilder: (c, e, s) => Icon(Icons.broken_image, size: 50),
                            ),
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              imageUrl,
                              style: TextStyle(
                                fontSize: 12,
                                decoration: isMarkedForDeletion ? TextDecoration.lineThrough : null,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isMarkedForDeletion)
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _imagesToDelete.remove(imageId);
                                });
                                _checkForChanges();
                              },
                              child: Text('Hoàn tác', style: TextStyle(fontSize: 12)),
                            )
                          else
                            IconButton(
                              icon: Icon(Icons.delete, color: Colors.red, size: 20),
                              onPressed: () {
                                setState(() {
                                  _imagesToDelete.add(imageId);
                                });
                                _checkForChanges();
                              },
                              padding: EdgeInsets.zero,
                              constraints: BoxConstraints(),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
              SizedBox(height: 16),
            ],

            // Add new images section
            Text(
              'Thêm hình ảnh mới (tùy chọn)',
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

            // Display new image URLs
            if (_newImageUrls.isNotEmpty) ...[
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hình ảnh mới sẽ thêm (${_newImageUrls.length})',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.green[800],
                      ),
                    ),
                    SizedBox(height: 8),
                    ..._newImageUrls.asMap().entries.map((entry) {
                      final index = entry.key;
                      final url = entry.value;
                      return Container(
                        margin: EdgeInsets.only(bottom: 8),
                        padding: EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green[300]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.image, color: Colors.green, size: 20),
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
                              onPressed: () => _removeNewImageUrl(index),
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

            // Update button (only show if there are changes)
            if (_hasChanges)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _updateReview,
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
                          'Cập nhật đánh giá',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.info_outline, color: Colors.grey[600]),
                    SizedBox(width: 8),
                    Text(
                      'Chưa có thay đổi nào',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
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
      _newImageUrls.add(url);
      _imageUrlController.clear();
    });
    _checkForChanges();
  }

  void _removeNewImageUrl(int index) {
    setState(() {
      _newImageUrls.removeAt(index);
    });
    _checkForChanges();
  }

  Future<void> _updateReview() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Vui lòng đăng nhập lại');
      }

      final reviewId = widget.existingReview['reviewId'] ?? widget.existingReview['review_id'];
      if (reviewId == null) {
        throw Exception('Không tìm thấy ID đánh giá');
      }

      // Update ratings if changed
      final hasRatingChanges = 
        _cleanlinessRating != _originalCleanlinessRating ||
        _comfortRating != _originalComfortRating ||
        _serviceRating != _originalServiceRating ||
        _locationRating != _originalLocationRating ||
        _valueRating != _originalValueRating;

      if (hasRatingChanges) {
        final ratingsData = {
          'cleanliness_rating': _cleanlinessRating.toInt(),
          'comfort_rating': _comfortRating.toInt(),
          'service_rating': _serviceRating.toInt(),
          'location_rating': _locationRating.toInt(),
          'value_rating': _valueRating.toInt(),
        };

        print('📤 Updating ratings: $ratingsData');
        final ratingResult = await ReviewService().updateSubRatings(reviewId, ratingsData, token);
        print('📦 Rating update result: $ratingResult');

        if (!ratingResult['success']) {
          throw Exception(ratingResult['message'] ?? 'Không thể cập nhật đánh giá');
        }
      }

      // Delete images if any marked for deletion
      for (final imageId in _imagesToDelete) {
        print('📤 Deleting image: $imageId');
        final deleteResult = await ReviewImageService().deleteReviewImage(imageId, token);
        print('📦 Image delete result: $deleteResult');
        
        if (!deleteResult['success']) {
          print('⚠️ Failed to delete image $imageId: ${deleteResult['message']}');
        }
      }

      // Upload new images if any
      if (_newImageUrls.isNotEmpty) {
        print('📤 Uploading ${_newImageUrls.length} new images');
        final uploadResult = await ReviewImageService().uploadReviewImages(
          reviewId,
          _newImageUrls,
          token,
        );
        print('📦 Image upload result: $uploadResult');
        
        if (!uploadResult['success']) {
          print('⚠️ Image upload failed: ${uploadResult['message']}');
        }
      }

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đánh giá đã được cập nhật!'),
            backgroundColor: Colors.green,
          ),
        );

        // Go back
        Navigator.pop(context, true);
      }
    } catch (e) {
      print('❌ Error updating review: $e');
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
