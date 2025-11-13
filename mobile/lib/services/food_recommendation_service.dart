import 'dart:convert';
import 'package:http/http.dart' as http;
import '../classes/food_recommendation_model.dart';
import 'api_config.dart';
import 'token_service.dart';

class FoodRecommendationService {
  // Singleton pattern
  static final FoodRecommendationService _instance = FoodRecommendationService._internal();
  factory FoodRecommendationService() => _instance;
  FoodRecommendationService._internal();

  // Default headers
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers with token
  Map<String, String> _headersWithToken(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // =============================
  // PUBLIC METHODS
  // =============================

  /// Lấy tất cả gợi ý món ăn của một địa điểm
  /// GET /api/v1/food-recommendations/:locationId/food-recommendations
  Future<Map<String, dynamic>> getRecommendationsByLocation(String locationId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/food-recommendations/$locationId/food-recommendations');
      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        List<FoodRecommendation> foods = [];
        if (responseData['data'] != null) {
          foods = (responseData['data'] as List)
              .map((json) => FoodRecommendation.fromJson(json))
              .toList();
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách món ăn thành công',
          'data': foods,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách món ăn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả gợi ý món ăn theo thành phố
  /// GET /api/v1/food-recommendations/city/:city
  Future<Map<String, dynamic>> getRecommendationsByCity(String city) async {
    try {
      final encodedCity = Uri.encodeComponent(city);
      final url = Uri.parse('${ApiConfig.baseUrl}/food-recommendations/city/$encodedCity');
      print('🔗 Request URL: $url');
      
      final response = await http.get(url, headers: _headers);
      print('📡 Response status: ${response.statusCode}');
      print('📦 Response body: ${response.body}');
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200 && responseData['status'] == 'success') {
        List<FoodRecommendation> foods = [];
        if (responseData['data'] != null && responseData['data'] is List) {
          foods = (responseData['data'] as List)
              .map((json) {
                // Convert camelCase to snake_case
                final convertedJson = {
                  'food_id': json['foodId'],
                  'location_id': json['locationId'],
                  'name': json['name'],
                  'description': json['description'],
                  'image_url': json['imageUrl'],
                  'latitude': json['latitude'],
                  'longitude': json['longitude'],
                  'created_at': json['createdAt'] ?? DateTime.now().toIso8601String(),
                };
                return FoodRecommendation.fromJson(convertedJson);
              })
              .toList();
        }
        print('✅ Parsed ${foods.length} foods');
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách món ăn thành công',
          'data': foods,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách món ăn',
        };
      }
    } catch (e, stackTrace) {
      print('❌ Error in getRecommendationsByCity: $e');
      print('Stack: $stackTrace');
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // =============================
  // ADMIN METHODS (require token)
  // =============================

  /// Tạo mới gợi ý món ăn
  /// POST /api/v1/food-recommendations
  Future<Map<String, dynamic>> createFoodRecommendation(Map<String, dynamic> foodData, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/food-recommendations');
      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(foodData),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 201) {
        FoodRecommendation? food;
        if (responseData['data'] != null) {
          food = FoodRecommendation.fromJson(responseData['data']);
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Tạo món ăn thành công',
          'data': food,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tạo món ăn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật gợi ý món ăn
  /// PUT /api/v1/food-recommendations/:id
  Future<Map<String, dynamic>> updateFoodRecommendation(String foodId, Map<String, dynamic> foodData, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/food-recommendations/$foodId');
      final response = await http.put(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(foodData),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        FoodRecommendation? food;
        if (responseData['data'] != null) {
          food = FoodRecommendation.fromJson(responseData['data']);
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Cập nhật món ăn thành công',
          'data': food,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi cập nhật món ăn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Xóa gợi ý món ăn
  /// DELETE /api/v1/food-recommendations/:id
  Future<Map<String, dynamic>> deleteFoodRecommendation(String foodId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/food-recommendations/$foodId');
      final response = await http.delete(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Xóa món ăn thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi xóa món ăn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
