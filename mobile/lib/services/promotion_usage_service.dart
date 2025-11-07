import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class PromotionUsageService {
  // Singleton pattern
  static final PromotionUsageService _instance = PromotionUsageService._internal();
  factory PromotionUsageService() => _instance;
  PromotionUsageService._internal();

  // Headers có token
  Map<String, String> _headersWithToken(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // ============================================
  // AUTHENTICATED METHODS (Admin/Hotel Owner)
  // ============================================

  /// Ghi nhận sử dụng khuyến mãi
  /// POST /api/v1/promotions/:promotionId/use
  Future<Map<String, dynamic>> usePromotion({
    required String promotionId,
    required String userId,
    required String bookingId,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/use');
      String? authToken = token;
      authToken ??= await TokenService.getToken();
      if (authToken == null || authToken.isEmpty) {
        return {'success': false, 'message': 'Bạn chưa đăng nhập'};
      }
      final body = json.encode({
        'user_id': userId,
        'booking_id': bookingId,
      });
      final response = await http.post(
        url,
        headers: _headersWithToken(authToken),
        body: body,
      );
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

  /// Lấy lịch sử sử dụng của một mã khuyến mãi
  /// GET /api/v1/promotions/:promotionId/usage-history
  Future<Map<String, dynamic>> getUsageHistory({
    required String promotionId,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/promotions/$promotionId/usage-history');
      
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

  // Note: Việc ghi log promotion usage thường được xử lý tự động
  // bởi backend khi tạo booking, không cần API riêng từ mobile app
}
