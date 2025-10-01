import 'package:flutter/material.dart';
import '../../services/booking_service.dart';
import '../../services/hotel_service.dart';
import '../../services/token_service.dart';
import '../../services/user_service.dart';
import '../../classes/user_model.dart';
import '../../classes/hotel_model.dart';
import 'chat_detail_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final BookingService _bookingService = BookingService();
  final HotelService _hotelService = HotelService();
  List<dynamic> _bookings = [];
  List<dynamic> _enrichedBookings = []; // Bookings với thông tin đầy đủ
  bool _isLoading = true;
  String? _errorMessage;
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _loadUserBookings();
  }

  Future<void> _loadUserBookings() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      // Kiểm tra token trước
      final hasToken = await TokenService.hasToken();
      final token = await TokenService.getToken();
      final userJson = await TokenService.getUser();

      print('DEBUG: hasToken = $hasToken');
      print(
        'DEBUG: token = ${token != null ? '${token.substring(0, 20)}...' : 'null'}',
      );
      print('DEBUG: userJson = $userJson');

      if (!hasToken) {
        setState(() {
          _errorMessage = 'Bạn cần đăng nhập để xem danh sách đặt phòng';
          _isLoading = false;
        });
        return;
      }

      // Lấy thông tin user giống như ProfileScreen
      _currentUser = await UserService.getUser();
      print('DEBUG: Current user = ${_currentUser?.userId}');

      if (_currentUser == null) {
        setState(() {
          _errorMessage =
              'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.';
          _isLoading = false;
        });
        return;
      }

      // Gọi API lấy danh sách booking
      final result = await _bookingService.getBookingsByUserId(
        _currentUser!.userId,
      );

      if (result['success'] == true) {
        final bookings = result['data'] ?? [];

        // Load thông tin đầy đủ cho từng booking
        _enrichedBookings = await _enrichBookingsWithDetails(bookings);

        setState(() {
          _bookings = bookings;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              result['message'] ?? 'Lỗi khi tải danh sách đặt phòng';
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

  Future<void> _refreshBookings() async {
    await _loadUserBookings();
  }

  // Enrich bookings với thông tin hotel và room type
  Future<List<dynamic>> _enrichBookingsWithDetails(
    List<dynamic> bookings,
  ) async {
    List<dynamic> enrichedList = [];

    for (var booking in bookings) {
      var enrichedBooking = Map<String, dynamic>.from(booking);
      final bookingId = booking['booking_id'] ?? booking['bookingId'] ?? '';

      print('🔍 DEBUG: Processing booking $bookingId');
      print('🔍 Raw booking data: $booking');

      try {
        // Load hotel info
        final hotelId = booking['hotel_id'] ?? booking['hotelId'] ?? '';
        print('🔍 Hotel ID: $hotelId');

        if (hotelId.isNotEmpty) {
          print('🔍 Calling getHotelById for $hotelId');
          final hotelResult = await _hotelService.getHotelById(hotelId);
          print('🔍 Hotel result success: ${hotelResult['success']}');

          if (hotelResult['success'] == true) {
            final hotelData = hotelResult['data'] as Hotel?;
            enrichedBooking['hotel_info'] = hotelData;

            // Truy cập property trực tiếp từ Hotel object
            final hotelName = hotelData?.name ?? 'Khách sạn không xác định';
            enrichedBooking['hotel_name'] = hotelName;
            print('🔍 Hotel name set to: $hotelName');
          } else {
            print('❌ Failed to get hotel info: ${hotelResult['message']}');
            enrichedBooking['hotel_name'] = 'Lỗi tải khách sạn';
          }
        } else {
          print('❌ Hotel ID is empty');
          enrichedBooking['hotel_name'] = 'Khách sạn không xác định';
        }

        // Load booking details để lấy room type info
        if (bookingId.isNotEmpty) {
          print('🔍 Calling getBookingById for $bookingId');
          final bookingDetailResult = await _bookingService.getBookingById(
            bookingId,
          );
          print('🔍 Booking detail result: $bookingDetailResult');

          if (bookingDetailResult['success'] == true) {
            final bookingDetailData = bookingDetailResult['data'];
            print('🔍 Full booking detail response: $bookingDetailData');
            enrichedBooking['booking_detail'] = bookingDetailData;

            // Booking detail trả về { booking: {...}, details: [...] }
            String roomTypeId = '';

            if (bookingDetailData != null) {
              final details = bookingDetailData['details'];
              print('🔍 Booking details array: $details');

              if (details != null && details is List && details.isNotEmpty) {
                final firstDetail = details[0];
                print('🔍 First booking detail: $firstDetail');
                roomTypeId = firstDetail['roomTypeId'] ?? '';
              }
            }

            print('🔍 Room type ID extracted: $roomTypeId');

            if (roomTypeId.isNotEmpty) {
              print('🔍 Calling getRoomTypeById for $roomTypeId');
              final roomTypeResult = await _hotelService.getRoomTypeById(
                roomTypeId,
              );
              print(
                '🔍 Room type result success: ${roomTypeResult['success']}',
              );

              if (roomTypeResult['success'] == true) {
                final roomTypeData =
                    roomTypeResult['data'] as Map<String, dynamic>?;
                print('🔍 Room type data: $roomTypeData');
                print('🔍 Room type data keys: ${roomTypeData?.keys.toList()}');
                enrichedBooking['room_type_info'] = roomTypeData;

                // Room type data là Map
                final roomTypeName =
                    roomTypeData?['name'] ?? 'Loại phòng không xác định';
                enrichedBooking['room_type_name'] = roomTypeName;
                print('🔍 Room type name set to: $roomTypeName');
              } else {
                print(
                  '❌ Failed to get room type info: ${roomTypeResult['message']}',
                );
                enrichedBooking['room_type_name'] = 'Lỗi tải loại phòng';
              }
            } else {
              print('❌ Room type ID is empty');
              enrichedBooking['room_type_name'] = 'Loại phòng không xác định';
            }
          } else {
            print(
              '❌ Failed to get booking detail: ${bookingDetailResult['message']}',
            );
            enrichedBooking['room_type_name'] = 'Lỗi tải booking';
          }
        } else {
          print('❌ Booking ID is empty');
          enrichedBooking['room_type_name'] = 'Booking không xác định';
        }
      } catch (e) {
        print(
          '❌ Exception khi load thông tin chi tiết cho booking $bookingId: $e',
        );
        enrichedBooking['hotel_name'] = 'Lỗi load dữ liệu';
        enrichedBooking['room_type_name'] = 'Lỗi load dữ liệu';
      }

      print(
        '🔍 Final enriched booking: ${enrichedBooking['hotel_name']} - ${enrichedBooking['room_type_name']}',
      );
      enrichedList.add(enrichedBooking);
    }

    print('🔍 Total enriched bookings: ${enrichedList.length}');
    return enrichedList;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Chat & Booking',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshBookings,
          ),
        ],
      ),
      body: Column(
        children: [
          // Header section
          // Container(
          //   width: double.infinity,
          //   padding: EdgeInsets.all(16),
          //   decoration: BoxDecoration(
          //     color: Colors.orange.shade50,
          //     borderRadius: BorderRadius.only(
          //       bottomLeft: Radius.circular(20),
          //       bottomRight: Radius.circular(20),
          //     ),
          //   ),
          //   child: Column(
          //     crossAxisAlignment: CrossAxisAlignment.start,
          //     children: [
          //       Text(
          //         'Chào ${_currentUser?.fullName ?? _currentUser?.username ?? 'bạn'}!',
          //         style: TextStyle(
          //           fontSize: 18,
          //           fontWeight: FontWeight.bold,
          //           color: Colors.orange.shade800,
          //         ),
          //       ),
          //       SizedBox(height: 4),
          //       Text(
          //         'Tổng cộng: ${_bookings.length} đặt phòng',
          //         style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          //       ),
          //     ],
          //   ),
          // ),

          // Body section
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
            ),
            SizedBox(height: 16),
            Text(
              'Đang tải danh sách đặt phòng...',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      // Kiểm tra nếu là lỗi đăng nhập
      bool isLoginError =
          _errorMessage!.contains('đăng nhập') ||
          _errorMessage!.contains('Không tìm thấy thông tin người dùng');

      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isLoginError ? Icons.login : Icons.error_outline,
              size: 64,
              color: isLoginError
                  ? Colors.orange.shade300
                  : Colors.red.shade300,
            ),
            SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isLoginError
                    ? Colors.grey.shade700
                    : Colors.red.shade600,
                fontSize: 16,
              ),
            ),
            SizedBox(height: 16),
            if (isLoginError) ...[
              ElevatedButton.icon(
                onPressed: _navigateToLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                icon: Icon(Icons.login),
                label: Text('Đăng nhập ngay'),
              ),
            ] else ...[
              ElevatedButton(
                onPressed: _refreshBookings,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                ),
                child: Text('Thử lại'),
              ),
            ],
          ],
        ),
      );
    }

    if (_bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hotel_outlined, size: 64, color: Colors.grey.shade400),
            SizedBox(height: 16),
            Text(
              'Bạn chưa có đặt phòng nào',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Hãy khám phá và đặt phòng ngay!',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // Navigate to explore tab (index 1)
                // You might need to implement navigation logic here
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: Text('Khám phá ngay'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _refreshBookings,
      color: Colors.orange,
      child: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: _bookings.length,
        itemBuilder: (context, index) {
          final booking = _bookings[index];
          return _buildBookingCard(booking);
        },
      ),
    );
  }

  Widget _buildBookingCard(dynamic booking) {
    // Tìm enriched booking để hiển thị thông tin đầy đủ
    dynamic enrichedBooking = booking;
    final bookingId = booking['booking_id'] ?? booking['bookingId'] ?? '';
    for (var eb in _enrichedBookings) {
      if ((eb['booking_id'] ?? eb['bookingId']) == bookingId) {
        enrichedBooking = eb;
        break;
      }
    }

    final checkInDate =
        booking['check_in_date'] ?? booking['checkInDate'] ?? '';
    final checkOutDate =
        booking['check_out_date'] ?? booking['checkOutDate'] ?? '';
    final totalPrice = booking['total_price'] ?? booking['totalPrice'] ?? 0;
    final bookingStatus =
        booking['booking_status'] ?? booking['bookingStatus'] ?? 'pending';
    final paymentStatus =
        booking['payment_status'] ?? booking['paymentStatus'] ?? 'pending';
    final totalGuests = booking['total_guests'] ?? booking['totalGuests'] ?? 1;

    // Thông tin đầy đủ từ enriched booking
    final hotelName = enrichedBooking['hotel_name'] ?? 'Khách sạn';
    final roomTypeName = enrichedBooking['room_type_name'] ?? 'Phòng';

    print('🎨 UI Debug - Booking ID: $bookingId');
    print('🎨 UI Debug - Hotel name: $hotelName');
    print('🎨 UI Debug - Room type name: $roomTypeName');
    print(
      '🎨 UI Debug - Enriched booking keys: ${enrichedBooking.keys.toList()}',
    );

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          // Mở chat ngay lập tức
          _openChatForBooking(booking);
        },
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Đặt phòng khách sạn',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade800,
                      ),
                    ),
                  ),
                  _buildStatusChip(bookingStatus),
                ],
              ),
              SizedBox(height: 8),

              // Hotel info với tên thật
              Row(
                children: [
                  Icon(Icons.hotel, size: 16, color: Colors.grey.shade600),
                  SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      hotelName,
                      style: TextStyle(
                        color: Colors.grey.shade800,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 4),

              // Room type info
              Row(
                children: [
                  Icon(
                    Icons.meeting_room,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      roomTypeName,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 4),

              // Date range
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  SizedBox(width: 4),
                  Text(
                    '${_formatDate(checkInDate)} - ${_formatDate(checkOutDate)}',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                  ),
                ],
              ),
              SizedBox(height: 4),

              // Guests and price
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.people, size: 16, color: Colors.grey.shade600),
                      SizedBox(width: 4),
                      Text(
                        '$totalGuests khách',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${_formatPrice(totalPrice)} VND',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange.shade700,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),

              // Payment status
              Row(
                children: [
                  Icon(Icons.payment, size: 16, color: Colors.grey.shade600),
                  SizedBox(width: 4),
                  Text(
                    'Thanh toán: ',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                  ),
                  _buildPaymentStatusChip(paymentStatus),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status.toLowerCase()) {
      case 'confirmed':
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        displayText = 'Đã xác nhận';
        break;
      case 'pending':
        backgroundColor = Colors.yellow.shade100;
        textColor = Colors.yellow.shade700;
        displayText = 'Chờ xác nhận';
        break;
      case 'canceled':
        backgroundColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        displayText = 'Đã hủy';
        break;
      case 'completed':
        backgroundColor = Colors.blue.shade100;
        textColor = Colors.blue.shade700;
        displayText = 'Hoàn thành';
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
        displayText = status;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildPaymentStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status.toLowerCase()) {
      case 'paid':
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        displayText = 'Đã thanh toán';
        break;
      case 'pending':
        backgroundColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        displayText = 'Chờ thanh toán';
        break;
      case 'failed':
        backgroundColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        displayText = 'Thất bại';
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
        displayText = status;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    if (dateString.isEmpty) return '';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final priceDouble = double.tryParse(price.toString()) ?? 0;
    return priceDouble
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }

  void _openChatForBooking(dynamic booking) {
    final bookingId = booking['booking_id'] ?? booking['bookingId'] ?? '';

    if (bookingId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không tìm thấy thông tin booking'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Tìm enriched booking để có thông tin đầy đủ
    dynamic enrichedBooking = booking;
    for (var eb in _enrichedBookings) {
      if ((eb['booking_id'] ?? eb['bookingId']) == bookingId) {
        enrichedBooking = eb;
        break;
      }
    }

    // Navigate to chat detail screen ngay lập tức
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ChatDetailScreen(bookingId: bookingId, booking: enrichedBooking),
      ),
    );
  }

  void _navigateToLogin() {
    // Navigate to login screen
    // You need to implement this based on your app's navigation structure
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Điều hướng đến trang đăng nhập...'),
        backgroundColor: Colors.orange,
      ),
    );

    // Example: Navigate to login screen (uncomment when you have login screen)
    // Navigator.pushNamed(context, '/login');
    // Or navigate to profile tab where login might be handled
    // Navigator.of(context).pop(); // Go back to previous screen
  }
}
