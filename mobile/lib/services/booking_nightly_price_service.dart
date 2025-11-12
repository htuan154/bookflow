import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class BookingNightlyPriceService {
  // Singleton pattern
  static final BookingNightlyPriceService _instance = BookingNightlyPriceService._internal();
  factory BookingNightlyPriceService() => _instance;
  BookingNightlyPriceService._internal();

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
  // GET: Lấy danh sách nightly prices theo bookingId
  Future<Map<String, dynamic>> getByBookingId(String bookingId, {String? token}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/booking-nightly-prices/$bookingId');
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }
      final response = await http.get(url, headers: _headersWithToken(authToken));
      final data = json.decode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // POST: Tạo nightly price mới
  Future<Map<String, dynamic>> create(Map<String, dynamic> nightlyPrice, {String? token}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/booking-nightly-prices');
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }
      final response = await http.post(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode(nightlyPrice),
      );
      final data = json.decode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
