import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class PromotionDetailService {
  // Singleton pattern
  static final PromotionDetailService _instance = PromotionDetailService._internal();
  factory PromotionDetailService() => _instance;
  PromotionDetailService._internal();

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

  /// Lấy danh sách chi tiết của một chương trình khuyến mãi
  /// GET /api/v1/promotions/:promotionId/details
  Future<Map<String, dynamic>> getDetailsForPromotion(String promotionId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/details');
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
  // AUTHENTICATED METHODS (Admin/Hotel Owner)
  // ============================================

  /// Thêm chi tiết cho một chương trình khuyến mãi
  /// POST /api/v1/promotions/:promotionId/details
  Future<Map<String, dynamic>> addDetailsToPromotion({
    required String promotionId,
    required List<Map<String, dynamic>> details,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/details');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.post(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode({'details': details}),
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

  /// Tạo nhiều chi tiết khuyến mãi (bulk create)
  /// POST /api/v1/promotions/:promotionId/details/bulk
  Future<Map<String, dynamic>> createDetailsBulk({
    required String promotionId,
    required List<Map<String, dynamic>> details,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/details/bulk');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.post(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode({'details': details}),
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

  /// Cập nhật chi tiết khuyến mãi
  /// PUT /api/v1/promotions/:promotionId/details/:detailId
  Future<Map<String, dynamic>> updateDetail({
    required String promotionId,
    required String detailId,
    required Map<String, dynamic> updateData,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/details/$detailId');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.put(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode(updateData),
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

  /// Cập nhật nhiều chi tiết khuyến mãi (bulk update)
  /// PUT /api/v1/promotions/:promotionId/details/bulk-update
  Future<Map<String, dynamic>> updateDetailsBulk({
    required String promotionId,
    required List<Map<String, dynamic>> details,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/details/bulk-update');
      
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }

      final response = await http.put(
        url,
        headers: _headersWithToken(authToken),
        body: json.encode({'details': details}),
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

  /// Xóa chi tiết khuyến mãi
  /// DELETE /api/v1/promotions/:promotionId/details/:detailId
  Future<Map<String, dynamic>> deleteDetail({
    required String promotionId,
    required String detailId,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/details/$detailId');
      
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
}
