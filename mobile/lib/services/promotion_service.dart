import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class PromotionService {
  // Singleton pattern
  static final PromotionService _instance = PromotionService._internal();
  factory PromotionService() => _instance;
  PromotionService._internal();

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
  // PUBLIC METHODS (không cần authentication)
  // ============================================

  /// Lấy tất cả các chương trình khuyến mãi
  /// GET /api/v1/promotions
  Future<Map<String, dynamic>> getAllPromotions() async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions');
      final response = await http.get(url, headers: _headers);
      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['status'] == 'success') {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy khuyến mãi theo hotel ID
  /// GET /api/v1/promotions/hotel/:hotelId
  Future<Map<String, dynamic>> getPromotionsByHotelId(String hotelId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/hotel/$hotelId');
      final response = await http.get(url, headers: _headers);
      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['status'] == 'success') {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy khuyến mãi theo code
  /// GET /api/v1/promotions/code/:code
  Future<Map<String, dynamic>> getPromotionByCode(String code) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/code/$code');
      final response = await http.get(url, headers: _headers);
      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['status'] == 'success') {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy chi tiết một chương trình khuyến mãi
  /// GET /api/v1/promotions/:promotionId
  Future<Map<String, dynamic>> getPromotionById(String promotionId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId');
      final response = await http.get(url, headers: _headers);
      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['status'] == 'success') {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // AUTHENTICATED METHODS (cần authentication)
  // ============================================

  /// Xác thực mã khuyến mãi
  /// POST /api/v1/promotions/validate
  Future<Map<String, dynamic>> validatePromotion({
    required String code,
    required double bookingTotal,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/validate');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.post(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode({
          'code': code,
          'bookingTotal': bookingTotal,
        }),
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

  /// Tạo chương trình khuyến mãi mới (Admin/Hotel Owner)
  /// POST /api/v1/promotions
  Future<Map<String, dynamic>> createPromotion({
    required Map<String, dynamic> promotionData,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.post(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode(promotionData),
      );
      
      final data = json.decode(response.body);
      
      if (response.statusCode == 201 && data['success'] == true) {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật chương trình khuyến mãi (Admin/Hotel Owner)
  /// PUT /api/v1/promotions/:promotionId
  Future<Map<String, dynamic>> updatePromotion({
    required String promotionId,
    required Map<String, dynamic> promotionData,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.put(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode(promotionData),
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

  /// Xóa chương trình khuyến mãi (Admin/Hotel Owner)
  /// DELETE /api/v1/promotions/:promotionId
  Future<Map<String, dynamic>> deletePromotion({
    required String promotionId,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.delete(
        url,
        headers: _headersWithToken(authToken),
      );
      
      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'message': data['message'] ?? 'Xóa thành công'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Unknown error'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lọc khuyến mãi theo điều kiện (Admin/Hotel Owner)
  /// GET /api/v1/promotions/filter
  Future<Map<String, dynamic>> filterPromotions({
    String? status,
    String? code,
    String? startDate,
    String? endDate,
    String? hotelId,
    String? token,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (status != null) queryParams['status'] = status;
      if (code != null) queryParams['code'] = code;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      if (hotelId != null) queryParams['hotelId'] = hotelId;

      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/filter')
          .replace(queryParameters: queryParams);
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.get(
        url,
        headers: _headersWithToken(authToken),
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
