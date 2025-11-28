import 'dart:convert';
import 'package:http/http.dart' as http;
import '../classes/tourist_location_model.dart';
import '../classes/nearby_tourist_location.dart';
import 'api_config.dart';
import 'token_service.dart';

class TouristLocationService {
  // Singleton pattern
  static final TouristLocationService _instance = TouristLocationService._internal();
  factory TouristLocationService() => _instance;
  TouristLocationService._internal();

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

  /// Lấy tất cả địa điểm du lịch
  /// GET /api/v1/tourist-locations
  Future<Map<String, dynamic>> getAllLocations() async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations');
      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        List<TouristLocation> locations = [];
        if (responseData['data'] != null) {
          locations = (responseData['data'] as List)
              .map((json) => TouristLocation.fromJson(json))
              .toList();
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách địa điểm thành công',
          'data': locations,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách địa điểm',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy 10 địa điểm du lịch gần nhất theo vị trí (lat, lng)
  /// GET /api/v1/tourist-locations/nearest?lat=...&lng=...
  Future<Map<String, dynamic>> getNearestLocations(double lat, double lng) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations/nearest?lat=$lat&lng=$lng');
      print('🔗 Request URL: $url');
      
      final response = await http.get(url, headers: _headers);
      print('📡 Response status: ${response.statusCode}');
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200 && responseData['status'] == 'success') {
        List<NearbyTouristLocation> locations = [];
        if (responseData['data'] != null && responseData['data'] is List) {
          locations = (responseData['data'] as List)
              .map((json) => NearbyTouristLocation.fromJson(json))
              .toList();
        }
        print('✅ Parsed ${locations.length} nearby locations');
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy địa điểm gần nhất thành công',
          'data': locations,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy địa điểm gần nhất',
        };
      }
    } catch (e, stackTrace) {
      print('❌ Error in getNearestLocations: $e');
      print('Stack: $stackTrace');
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy địa điểm theo thành phố (không phân biệt hoa thường)
  /// GET /api/v1/tourist-locations/city/:city
  Future<Map<String, dynamic>> getLocationsByCity(String city) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations/city/$city');
      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        List<TouristLocation> locations = [];
        if (responseData['data'] != null) {
          locations = (responseData['data'] as List)
              .map((json) => TouristLocation.fromJson(json))
              .toList();
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy địa điểm thành công',
          'data': locations,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy địa điểm',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy địa điểm theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt)
  /// GET /api/v1/tourist-locations/city-vn/:city
  Future<Map<String, dynamic>> getLocationsByCityVn(String city) async {
    try {
      final encodedCity = Uri.encodeComponent(city);
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations/city-vn/$encodedCity');
      print('🔗 Request URL: $url');
      
      final response = await http.get(url, headers: _headers);
      print('📡 Response status: ${response.statusCode}');
      print('📦 Response body: ${response.body}');
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200 && responseData['status'] == 'success') {
        List<TouristLocation> locations = [];
        if (responseData['data'] != null && responseData['data'] is List) {
          locations = (responseData['data'] as List)
              .map((json) {
                // Convert camelCase to snake_case
                final convertedJson = {
                  'location_id': json['locationId'],
                  'name': json['name'],
                  'description': json['description'],
                  'city': json['city'],
                  'image_url': json['imageUrl'],
                  'latitude': json['latitude'],
                  'longitude': json['longitude'],
                  'created_at': json['createdAt'] ?? DateTime.now().toIso8601String(),
                };
                return TouristLocation.fromJson(convertedJson);
              })
              .toList();
        }
        print('✅ Parsed ${locations.length} locations');
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy địa điểm thành công',
          'data': locations,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy địa điểm',
        };
      }
    } catch (e, stackTrace) {
      print('❌ Error in getLocationsByCityVn: $e');
      print('Stack: $stackTrace');
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // =============================
  // ADMIN METHODS (require token)
  // =============================

  /// Tạo mới địa điểm du lịch
  /// POST /api/v1/tourist-locations
  Future<Map<String, dynamic>> createLocation(Map<String, dynamic> locationData, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations');
      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(locationData),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 201) {
        TouristLocation? location;
        if (responseData['data'] != null) {
          location = TouristLocation.fromJson(responseData['data']);
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Tạo địa điểm thành công',
          'data': location,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tạo địa điểm',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật địa điểm du lịch
  /// PUT /api/v1/tourist-locations/:id
  Future<Map<String, dynamic>> updateLocation(String locationId, Map<String, dynamic> locationData, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations/$locationId');
      final response = await http.put(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(locationData),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        TouristLocation? location;
        if (responseData['data'] != null) {
          location = TouristLocation.fromJson(responseData['data']);
        }
        return {
          'success': true,
          'message': responseData['message'] ?? 'Cập nhật địa điểm thành công',
          'data': location,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi cập nhật địa điểm',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Xóa địa điểm du lịch
  /// DELETE /api/v1/tourist-locations/:id
  Future<Map<String, dynamic>> deleteLocation(String locationId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/tourist-locations/$locationId');
      final response = await http.delete(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Xóa địa điểm thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi xóa địa điểm',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
