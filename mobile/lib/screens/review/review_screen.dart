import 'package:flutter/material.dart';
import '../../services/booking_service.dart';
import '../../services/user_service.dart';
import '../../services/review_service.dart';
import 'package:intl/intl.dart';
import 'review_form_screen.dart';
import 'review_view_edit_screen.dart';

class ReviewScreen extends StatefulWidget {
  const ReviewScreen({super.key});

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  bool _isLoading = true;
  List<dynamic> _completedBookings = [];
  Map<String, dynamic> _bookingReviews = {}; // Map bookingId -> review data
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCompletedBookings();
  }

  Future<void> _loadCompletedBookings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await UserService.getUser();
      if (user == null || user.userId == null) {
        setState(() {
          _errorMessage = 'Vui lòng đăng nhập để xem đánh giá';
          _isLoading = false;
        });
        return;
      }

      final result = await BookingService().getCompletedBookingsByUserId(user.userId!);
      
      if (result['success']) {
        final bookings = result['data'] ?? [];
        
        // Load reviews for each booking
        final reviews = <String, dynamic>{};
        for (final booking in bookings) {
          final bookingId = booking['bookingId'];
          if (bookingId != null) {
            try {
              final reviewResult = await ReviewService().getReviewByBookingId(bookingId);
              if (reviewResult['success'] && reviewResult['data'] != null) {
                reviews[bookingId] = reviewResult['data'];
              }
            } catch (e) {
              print('Error loading review for booking $bookingId: $e');
            }
          }
        }
        
        setState(() {
          _completedBookings = bookings;
          _bookingReviews = reviews;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Không thể tải danh sách đặt phòng';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi kết nối: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Đánh giá của tôi',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red),
                      SizedBox(height: 16),
                      Text(_errorMessage!, style: TextStyle(color: Colors.red)),
                      SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadCompletedBookings,
                        child: Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : _completedBookings.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.rate_review_outlined,
                              size: 100, color: Colors.grey),
                          SizedBox(height: 20),
                          Text(
                            'Chưa có đặt phòng hoàn thành',
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 10),
                          Text(
                            'Hãy hoàn thành chuyến đi để đánh giá',
                            style: TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadCompletedBookings,
                      child: ListView.builder(
                        padding: EdgeInsets.all(16),
                        itemCount: _completedBookings.length,
                        itemBuilder: (context, index) {
                          final booking = _completedBookings[index];
                          return _buildBookingCard(booking);
                        },
                      ),
                    ),
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> booking) {
  final bookingId = booking['bookingId'] ?? '';
  final hotelId = booking['hotelId'] ?? '';
  final checkInDateStr = booking['checkInDate'] ?? '';
  final checkOutDateStr = booking['checkOutDate'] ?? '';
  final nights = booking['nights'] ?? 0;
  final totalGuests = booking['totalGuests'] ?? 0;
  final totalPrice = booking['totalPrice'] != null
    ? double.tryParse(booking['totalPrice'].toString()) ?? 0.0
    : 0.0;
  final bookingStatus = booking['bookingStatus'] ?? 'unknown';
  final paymentStatus = booking['paymentStatus'] ?? 'unknown';
  
  // Check if this booking has a review
  final hasReview = _bookingReviews.containsKey(bookingId);
  final review = _bookingReviews[bookingId];

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'N/A';
    // Nếu là dạng yyyy-MM-ddTHH:mm:ss.sssZ hoặc yyyy-MM-ddTHH:mm:ss.sss
    final parts = dateStr.split('T');
    if (parts.isNotEmpty) {
    return parts[0].split('-').reversed.join('/'); // yyyy-MM-dd -> dd/MM/yyyy
    }
    return dateStr;
  }

  return Card(
      color: Colors.white,
      margin: EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to review form
          _showReviewDialog(bookingId, hotelId);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Booking #${bookingId.substring(0, 8)}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[800],
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green[100],
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Hoàn thành',
                      style: TextStyle(
                        color: Colors.green[800],
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              Divider(height: 24),
              _buildInfoRow(
                Icons.calendar_today,
                'Check-in',
                _formatDate(checkInDateStr),
              ),
              SizedBox(height: 8),
              _buildInfoRow(
                Icons.calendar_today_outlined,
                'Check-out',
                _formatDate(checkOutDateStr),
              ),
              SizedBox(height: 8),
              _buildInfoRow(Icons.nights_stay, 'Số đêm', '$nights đêm'),
              SizedBox(height: 8),
              _buildInfoRow(Icons.people, 'Khách', '$totalGuests người'),
              SizedBox(height: 8),
              _buildInfoRow(
                Icons.attach_money,
                'Tổng tiền',
                '${totalPrice.toStringAsFixed(0)} VNĐ',
              ),
              SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: hasReview
                    ? ElevatedButton.icon(
                        onPressed: () {
                          _showReviewViewEdit(bookingId, hotelId, review);
                        },
                        icon: Icon(Icons.visibility),
                        label: Text('Xem đánh giá'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      )
                    : ElevatedButton.icon(
                        onPressed: () {
                          _showReviewDialog(bookingId, hotelId);
                        },
                        icon: Icon(Icons.rate_review),
                        label: Text('Viết đánh giá'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey[600]),
        SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 14,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  void _showReviewDialog(String bookingId, String hotelId) async {
    // Navigate to review form
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ReviewFormScreen(
          bookingId: bookingId,
          hotelId: hotelId,
        ),
      ),
    );

    // If review was submitted successfully, reload the list
    if (result == true) {
      _loadCompletedBookings();
    }
  }

  void _showReviewViewEdit(String bookingId, String hotelId, Map<String, dynamic> review) async {
    // Navigate to review view/edit screen
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ReviewViewEditScreen(
          bookingId: bookingId,
          hotelId: hotelId,
          existingReview: review,
        ),
      ),
    );

    // If review was updated, reload the list
    if (result == true) {
      _loadCompletedBookings();
    }
  }
}
