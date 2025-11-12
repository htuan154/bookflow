// lib/hotel/components/hotel_card.dart
import 'package:flutter/material.dart';

class HotelCard extends StatelessWidget {
  final String name;
  final String address;
  final int? starRating;
  final String? phoneNumber;
  final String? email;
  final String? imageUrl;
  final VoidCallback? onTap;
  final VoidCallback? onFavoritePressed;

  const HotelCard({
    super.key,
    required this.name,
    required this.address,
    this.starRating,
    this.phoneNumber,
    this.email,
    this.imageUrl,
    this.onTap,
    this.onFavoritePressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap:
          onTap ??
          () {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text('$name hotel clicked!')));
          },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.15),
              spreadRadius: 1,
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section - Fixed height
            Stack(
              children: [
                Container(
                  height: 120, // Giảm từ 140 xuống 120
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    image: DecorationImage(
                      image: AssetImage('assets/welcome/welcome-image-1.png'),
                      fit: BoxFit.cover,
                      onError: (exception, stackTrace) {},
                    ),
                  ),
                ),
                // Star rating badge
                if (starRating != null && starRating! > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.star, color: Colors.white, size: 10),
                          SizedBox(width: 2),
                          Text(
                            '$starRating',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Đã xoá icon trái tim yêu thích
              ],
            ),

            // Content section - Flexible
            Expanded(
              child: Padding(
                padding: EdgeInsets.all(8), // Giảm padding từ 12 xuống 8
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min, // Thêm này
                  children: [
                    // Hotel name
                    Text(
                      name,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14, // Giảm từ 16 xuống 14
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 4),

                    // Address
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          color: Colors.grey[500],
                          size: 12,
                        ),
                        SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            address,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 10, // Giảm font size
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),

                    // Phone number - chỉ hiển thị nếu có space
                    if (phoneNumber != null && phoneNumber!.isNotEmpty) ...[
                      SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.phone, color: Colors.grey[500], size: 12),
                          SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              phoneNumber!,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 9, // Giảm font size
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],

                    // Email
                    if (email != null && email!.isNotEmpty) ...[
                      SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.email, color: Colors.grey[500], size: 12),
                          SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              email!,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 9,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],

                    // Spacer để đẩy star rating xuống dưới
                    Spacer(),

                    // Star rating ở bottom
                    if (starRating != null && starRating! > 0)
                      Row(
                        children: [
                          ...List.generate(5, (index) {
                            return Icon(
                              index < starRating!
                                  ? Icons.star
                                  : Icons.star_border,
                              color: Colors.orange,
                              size: 12, // Giảm size
                            );
                          }),
                          SizedBox(width: 4),
                          Text(
                            '($starRating sao)',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 9, // Giảm font size
                            ),
                          ),
                        ],
                      )
                    else
                      Text(
                        'Chưa có đánh giá',
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 9, // Giảm font size
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
