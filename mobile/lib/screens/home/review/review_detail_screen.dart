import 'package:flutter/material.dart';
import '../../../classes/review_model.dart';
import '../../../services/hotel_service.dart';

class ReviewDetailScreen extends StatefulWidget {
  final Review review;
  const ReviewDetailScreen({super.key, required this.review});

  @override
  State<ReviewDetailScreen> createState() => _ReviewDetailScreenState();
}

class _ReviewDetailScreenState extends State<ReviewDetailScreen> {
  List<String> imageUrls = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadReviewImages();
  }

  Future<void> _loadReviewImages() async {
    setState(() => isLoading = true);
    try {
      final result = await HotelService().getReviewImages(widget.review.reviewId);
      if (result['success'] && result['data'] != null) {
        setState(() {
          imageUrls = (result['data'] as List)
              .map((img) => img['imageUrl'] as String)
              .toList();
        });
      }
    } catch (e) {
      setState(() => imageUrls = []);
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final review = widget.review;
    return Scaffold(
      appBar: AppBar(
        title: Text('Chi tiết đánh giá'),
        backgroundColor: Colors.orange,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hình ảnh review
            if (isLoading)
              SizedBox(
                height: 220,
                child: Center(child: CircularProgressIndicator(color: Colors.orange)),
              )
            else if (imageUrls.isNotEmpty)
              SizedBox(
                height: 220,
                child: PageView.builder(
                  itemCount: imageUrls.length,
                  itemBuilder: (context, index) => Container(
                    margin: EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.grey[200],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.network(
                      imageUrls[index],
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorBuilder: (c, e, s) => Icon(Icons.broken_image, size: 80, color: Colors.grey),
                    ),
                  ),
                ),
              )
            else
              Container(
                height: 220,
                alignment: Alignment.center,
                child: Icon(Icons.image_not_supported, size: 80, color: Colors.grey[400]),
              ),
            // Thông tin review
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
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
                  SizedBox(height: 12),
                  Text(
                    review.comment ?? '',
                    style: TextStyle(fontSize: 15, color: Colors.black87),
                  ),
                  SizedBox(height: 12),
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
                  SizedBox(height: 12),
                  if (review.cleanlinessRating != null ||
                      review.comfortRating != null ||
                      review.serviceRating != null ||
                      review.locationRating != null ||
                      review.valueRating != null)
                    Wrap(
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
}