import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class BookingService {
  // Singleton pattern
  static final BookingService _instance = BookingService._internal();
  factory BookingService() => _instance;
  BookingService._internal();

  // Headers mặc định
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers có token
  Map<String, String> _headersWithToken(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /// Tạo booking mới
  /// POST /api/v1/bookings
  Future<Map<String, dynamic>> createBooking({
    required String userId,
    required String hotelId,
    required String checkInDate,
    required String checkOutDate,
    required int totalGuests,
    required double totalPrice,
    String bookingStatus = 'pending',
    String paymentStatus = 'pending',
    String? paymentMethod,
    String? promotionId,
    String? specialRequests,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/bookings');
      final token = await TokenService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Vui lòng đăng nhập để đặt phòng'};
      }

      Map<String, dynamic> requestBody = {
        'user_id': userId,
        'hotel_id': hotelId,
        'check_in_date': checkInDate,
        'check_out_date': checkOutDate,
        'total_guests': totalGuests,
        'total_price': totalPrice,
        'booking_status': bookingStatus,
        'payment_status': paymentStatus,
        'payment_method': paymentMethod,
        'promotion_id': promotionId,
        'special_requests': specialRequests,
      };

      // Xóa các trường null để tránh lỗi backend
      requestBody.removeWhere((key, value) => value == null);

      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(requestBody),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Đặt phòng thành công',
          'data': responseData['data'],
          'bookingId': responseData['data']?['bookingId'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi đặt phòng',
          'errors': responseData['errors'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách booking đã hoàn thành của user
  /// GET /api/v1/bookings/user/:userId/completed
  Future<Map<String, dynamic>> getCompletedBookingsByUserId(String userId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/bookings/user/$userId/completed');
      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để xem danh sách đặt phòng',
        };
      }
      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách đặt phòng thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Không tìm thấy đặt phòng',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy chi tiết booking
  /// GET /api/v1/bookings/:bookingId
  Future<Map<String, dynamic>> getBookingById(String bookingId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/bookings/$bookingId');

      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để xem chi tiết đặt phòng',
        };
      }

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy thông tin đặt phòng thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Không tìm thấy đặt phòng',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách booking theo userId
  /// GET /api/v1/bookings/user/:userId
  Future<Map<String, dynamic>> getBookingsByUserId(String userId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/bookings/user/$userId');
      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để xem danh sách đặt phòng',
        };
      }
      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách đặt phòng thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Không tìm thấy đặt phòng',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật trạng thái booking (chỉ owner/admin)
  /// PATCH /api/v1/bookings/:bookingId/status
  Future<Map<String, dynamic>> updateBookingStatus(
    String bookingId,
    String status, {
    String? notes,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/bookings/$bookingId/status');

      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để cập nhật trạng thái',
        };
      }

      Map<String, dynamic> requestBody = {'status': status};
      if (notes != null && notes.trim().isNotEmpty) {
        requestBody['notes'] = notes;
      }

      final response = await http.patch(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(requestBody),
      );
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Cập nhật trạng thái thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi cập nhật trạng thái',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy chi tiết booking detail theo detailId
  Future<Map<String, dynamic>> getBookingDetailById(String detailId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/booking-details/$detailId');
      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để xem chi tiết',
        };
      }
      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy chi tiết thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Không tìm thấy chi tiết',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách booking detail theo bookingId
  Future<Map<String, dynamic>> getBookingDetailsByBookingId(
    String bookingId,
  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/booking-details/booking/$bookingId',
      );
      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để xem chi tiết',
        };
      }
      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách chi tiết thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Không tìm thấy chi tiết',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Thêm booking detail cho booking
  Future<Map<String, dynamic>> addBookingDetails({
    required String bookingId,
    required Map<String, dynamic> bookingDetailData,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/booking-details/booking/$bookingId',
      );
      final token = await TokenService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Vui lòng đăng nhập để thêm chi tiết',
        };
      }
      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(bookingDetailData),
      );
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Thêm chi tiết thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi thêm chi tiết',
          'errors': responseData['errors'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
