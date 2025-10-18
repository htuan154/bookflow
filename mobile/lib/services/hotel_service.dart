import 'dart:convert';
import 'package:http/http.dart' as http;
import '../classes/hotel_model.dart';
import 'api_config.dart';
import 'token_service.dart';

class HotelService {
  // Singleton pattern
  static final HotelService _instance = HotelService._internal();
  factory HotelService() => _instance;
  HotelService._internal();

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

  /// Lấy danh sách tất cả khách sạn (có phân trang)
  /// GET /api/v1/hotels
  Future<Map<String, dynamic>> getAllHotels({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/hotels?page=$page&limit=$limit',
      );

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách khách sạn thành công',
          'data': hotels,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thông tin khách sạn theo ID
  /// GET /api/v1/hotels/:id
  Future<Map<String, dynamic>> getHotelById(String hotelId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/$hotelId');

      // Lấy token từ TokenService
      final token = await TokenService.getToken();

      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      final response = await http.get(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        Hotel? hotel;
        if (responseData['data'] != null) {
          hotel = Hotel.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy thông tin khách sạn thành công',
          'data': hotel,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Không tìm thấy khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Tìm kiếm khách sạn
  /// GET /api/v1/hotels/search
  Future<Map<String, dynamic>> searchHotels({
    String? city,
    String? name,
    double? minRating,
    double? maxRating,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      String queryString = 'page=$page&limit=$limit';

      if (city != null && city.isNotEmpty) {
        queryString += '&city=${Uri.encodeComponent(city)}';
      }
      if (name != null && name.isNotEmpty) {
        queryString += '&name=${Uri.encodeComponent(name)}';
      }
      if (minRating != null) {
        queryString += '&minRating=$minRating';
      }
      if (maxRating != null) {
        queryString += '&maxRating=$maxRating';
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/search?$queryString');

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Tìm kiếm thành công',
          'data': hotels,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tìm kiếm khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy khách sạn phổ biến
  /// GET /api/v1/hotels/popular
  Future<Map<String, dynamic>> getPopularHotels({int limit = 10}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/popular?limit=$limit');

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách khách sạn phổ biến thành công',
          'data': hotels,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách khách sạn phổ biến',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // AUTHENTICATED METHODS
  // ============================================

  /// Lấy khách sạn của user hiện tại
  /// GET /api/v1/hotels/my-hotels
  Future<Map<String, dynamic>> getMyHotels(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/my-hotels');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách khách sạn của bạn thành công',
          'data': hotels,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy khách sạn theo chủ sở hữu
  /// GET /api/v1/hotels/owner/:ownerId
  Future<Map<String, dynamic>> getHotelsByOwner(
    String ownerId,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/owner/$ownerId');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách khách sạn thành công',
          'data': hotels,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Tạo mới khách sạn
  /// POST /api/v1/hotels
  Future<Map<String, dynamic>> createHotel(
    Map<String, dynamic> hotelData,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels');

      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(hotelData),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        Hotel? hotel;
        if (responseData['data'] != null) {
          hotel = Hotel.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Khách sạn đã được tạo thành công',
          'data': hotel,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tạo khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật thông tin khách sạn
  /// PUT /api/v1/hotels/:id
  Future<Map<String, dynamic>> updateHotel(
    String hotelId,
    Map<String, dynamic> hotelData,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/$hotelId');

      final response = await http.put(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(hotelData),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        Hotel? hotel;
        if (responseData['data'] != null) {
          hotel = Hotel.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Cập nhật khách sạn thành công',
          'data': hotel,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi cập nhật khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Xóa khách sạn
  /// DELETE /api/v1/hotels/:id
  Future<Map<String, dynamic>> deleteHotel(String hotelId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/$hotelId');

      final response = await http.delete(
        url,
        headers: _headersWithToken(token),
      );
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Xóa khách sạn thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi xóa khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /// Lấy tất cả khách sạn (Admin)
  /// GET /api/v1/hotels/admin/all
  Future<Map<String, dynamic>> getAllHotelsAdmin(
    String token, {
    int page = 1,
    int limit = 10,
    String? status,
  }) async {
    try {
      String queryString = 'page=$page&limit=$limit';
      if (status != null && status.isNotEmpty) {
        queryString += '&status=$status';
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/hotels/admin/all?$queryString',
      );

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách khách sạn thành công',
          'data': hotels,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy khách sạn chờ duyệt (Admin)
  /// GET /api/v1/hotels/admin/pending
  Future<Map<String, dynamic>> getPendingHotels(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/admin/pending');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách khách sạn chờ duyệt thành công',
          'data': hotels,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách khách sạn chờ duyệt',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thống kê khách sạn (Admin)
  /// GET /api/v1/hotels/admin/statistics
  Future<Map<String, dynamic>> getHotelStatistics(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/admin/statistics');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy thống kê khách sạn thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy thống kê khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật trạng thái khách sạn (Admin)
  /// PATCH /api/v1/hotels/admin/:id/status
  Future<Map<String, dynamic>> updateHotelStatus(
    String hotelId,
    String status,
    String token,
  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/hotels/admin/$hotelId/status',
      );

      final response = await http.patch(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode({'status': status}),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        Hotel? hotel;
        if (responseData['data'] != null) {
          hotel = Hotel.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Cập nhật trạng thái khách sạn thành công',
          'data': hotel,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi cập nhật trạng thái khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy khách sạn theo trạng thái (Admin)
  /// GET /api/v1/hotels/admin/status/:status
  Future<Map<String, dynamic>> getHotelsByStatus(
    String status,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/admin/status/$status');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách khách sạn theo trạng thái thành công',
          'data': hotels,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách khách sạn theo trạng thái',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /// Phê duyệt khách sạn (Admin)
  Future<Map<String, dynamic>> approveHotel(String hotelId, String token) {
    return updateHotelStatus(hotelId, 'approved', token);
  }

  /// Từ chối khách sạn (Admin)
  Future<Map<String, dynamic>> rejectHotel(String hotelId, String token) {
    return updateHotelStatus(hotelId, 'rejected', token);
  }

  /// Kích hoạt khách sạn (Admin)
  Future<Map<String, dynamic>> activateHotel(String hotelId, String token) {
    return updateHotelStatus(hotelId, 'active', token);
  }

  /// Vô hiệu hóa khách sạn (Admin)
  Future<Map<String, dynamic>> deactivateHotel(String hotelId, String token) {
    return updateHotelStatus(hotelId, 'inactive', token);
  }

  /// Tìm kiếm khách sạn theo thành phố và phường
  /// GET /api/v1/hotels/search/location?city=...&ward=...
  Future<Map<String, dynamic>> searchHotelsByLocation({
    required String city,
    required String ward,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      String queryString = 'page=$page&limit=$limit';
      queryString += '&city=${Uri.encodeComponent(city)}';
      queryString += '&ward=${Uri.encodeComponent(ward)}';

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/hotels/search/location?$queryString',
      );

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Hotel> hotels = [];
        if (responseData['data'] != null) {
          hotels = (responseData['data'] as List)
              .map((json) => Hotel.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Tìm kiếm khách sạn theo vị trí thành công',
          'data': hotels,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi tìm kiếm khách sạn theo vị trí',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Đếm số khách sạn theo thành phố và phường
  /// GET /api/v1/hotels/count/location?city=...&ward=...
  Future<Map<String, dynamic>> countHotelsByLocation({
    required String city,
    required String ward,
  }) async {
    try {
      String queryString =
          'city=${Uri.encodeComponent(city)}&ward=${Uri.encodeComponent(ward)}';

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/hotels/count/location?$queryString',
      );

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Đếm khách sạn theo vị trí thành công',
          'data': responseData['data'],
          'count': responseData['count'] ?? 0,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi đếm khách sạn theo vị trí',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách tiện nghi của khách sạn
  /// GET /api/v1/hotels/:hotelId/amenities
  Future<Map<String, dynamic>> getAmenitiesForHotel(String hotelId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/$hotelId/amenities');

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Nếu có model Amenity thì parse, còn không trả raw data
        final amenities = responseData['data'];
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách tiện nghi thành công',
          'data': amenities,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách tiện nghi',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả hình ảnh của một khách sạn
  /// GET /api/v1/hotels/:hotelId/images
  Future<Map<String, dynamic>> getHotelImages(String hotelId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/$hotelId/images');
      print('Calling API: $url'); // Debug log

      // Lấy token từ TokenService
      final token = await TokenService.getToken();

      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      final response = await http.get(url, headers: headers);
      print('Response status: ${response.statusCode}'); // Debug log
      print('Response body: ${response.body}'); // Debug log

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách ảnh thành công',
          'data': responseData['data'],
        };
      } else {
        final responseData = jsonDecode(response.body);
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách ảnh',
        };
      }
    } catch (e) {
      print('Exception in getHotelImages: $e'); // Debug log
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả đánh giá của một khách sạn
  /// GET /api/v1/reviews/:hotelId/reviews
  Future<Map<String, dynamic>> getReviewsForHotel(String hotelId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$hotelId');
      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('GET $url'); // Debug URL
      final response = await http.get(url, headers: headers);
      print('Status code: ${response.statusCode}'); // Debug status code
      print('Response body: ${response.body}'); // Debug body

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách đánh giá thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách đánh giá',
        };
      }
    } catch (e) {
      print('Lỗi kết nối: $e'); // Debug lỗi kết nối
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả hình ảnh của một đánh giá
  /// GET /api/v1/reviews/:reviewId/images
  Future<Map<String, dynamic>> getReviewImages(String reviewId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/images');
      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('GET $url'); // Debug URL
      final response = await http.get(url, headers: headers);
      print('Status code: ${response.statusCode}'); // Debug status code
      print('Response body: ${response.body}'); // Debug body

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách hình ảnh thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách hình ảnh',
        };
      }
    } catch (e) {
      print('Lỗi kết nối: $e'); // Debug lỗi kết nối
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả loại phòng của một khách sạn
  /// GET /api/v1/roomtypes/hotel/:hotelId
  Future<Map<String, dynamic>> getRoomTypesByHotelId(String hotelId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roomtypes/hotel/$hotelId');
      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('GET $url'); // Debug URL
      final response = await http.get(url, headers: headers);
      print('Status code: ${response.statusCode}'); // Debug status code
      print('Response body: ${response.body}'); // Debug body

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách loại phòng thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách loại phòng',
        };
      }
    } catch (e) {
      print('Lỗi kết nối: $e'); // Debug lỗi kết nối
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả hình ảnh của một loại phòng
  /// GET /api/v1/roomtypes/:roomTypeId/images
  Future<Map<String, dynamic>> getRoomTypeImages(String roomTypeId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/roomtypes/$roomTypeId/images',
      );
      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('GET $url'); // Debug URL
      final response = await http.get(url, headers: headers);
      print('Status code: ${response.statusCode}'); // Debug status code
      print('Response body: ${response.body}'); // Debug body

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách hình ảnh loại phòng thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách hình ảnh loại phòng',
        };
      }
    } catch (e) {
      print('Lỗi kết nối: $e'); // Debug lỗi kết nối
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy hình ảnh thumbnail của một loại phòng
  /// GET /api/v1/roomtypes/:roomTypeId/thumbnail
  Future<Map<String, dynamic>> getRoomTypeThumbnail(String roomTypeId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/roomtypes/$roomTypeId/thumbnail',
      );
      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('GET $url'); // Debug URL
      final response = await http.get(url, headers: headers);
      print('Status code: ${response.statusCode}'); // Debug status code
      print('Response body: ${response.body}'); // Debug body

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy thumbnail thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy thumbnail',
        };
      }
    } catch (e) {
      print('Lỗi kết nối: $e'); // Debug lỗi kết nối
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Tìm kiếm phòng có sẵn theo thành phố, ngày và phường (optional)
  /// POST /api/v1/hotels/search/availability
  Future<Map<String, dynamic>> searchAvailableRooms({
    required String city,
    required String checkInDate,
    required String checkOutDate,
    String? ward,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/hotels/search/availability');

      // Tạo request body
      Map<String, dynamic> requestBody = {
        'city': city,
        'checkInDate': checkInDate,
        'checkOutDate': checkOutDate,
      };

      // Thêm ward nếu có
      if (ward != null && ward.trim().isNotEmpty) {
        requestBody['ward'] = ward;
      }

      print('POST $url'); // Debug URL
      print('Request body: ${jsonEncode(requestBody)}'); // Debug body

      // Lấy token từ TokenService
      final token = await TokenService.getToken();

      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(requestBody),
      );

      print('Status code: ${response.statusCode}'); // Debug status
      print('Response body: ${response.body}'); // Debug response

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Tìm kiếm phòng trống thành công',
          'data': responseData['data'], // List of RoomTypeAvailability
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tìm kiếm phòng trống',
        };
      }
    } catch (e) {
      print('Exception in searchAvailableRooms: $e'); // Debug exception
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả quy tắc giá mùa vụ của một loại phòng
  /// GET /api/v1/seasonal-pricings/:roomTypeId
  Future<Map<String, dynamic>> getSeasonalPricingsForRoomType(
    String roomTypeId,
  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/seasonal-pricings/$roomTypeId',
      );
      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      // Sử dụng headers có token nếu có, không thì dùng headers thường
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('GET $url'); // Debug URL
      final response = await http.get(url, headers: headers);
      print('Status code: ${response.statusCode}'); // Debug status code
      print('Response body: ${response.body}'); // Debug body

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách seasonal pricing thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách seasonal pricing',
        };
      }
    } catch (e) {
      print('Lỗi kết nối: $e'); // Debug lỗi kết nối
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thông tin loại phòng theo ID
  /// GET /api/v1/roomtypes/:id
  Future<Map<String, dynamic>> getRoomTypeById(String roomTypeId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roomtypes/$roomTypeId');
      final token = await TokenService.getToken();
      final headers = token != null ? _headersWithToken(token) : _headers;

      print('🔍 API URL: $url');
      print('🔍 Headers: $headers');

      final response = await http.get(url, headers: headers);
      print('🔍 Response status: ${response.statusCode}');
      print('🔍 Response body: ${response.body}');

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy thông tin loại phòng thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy thông tin loại phòng',
        };
      }
    } catch (e) {
      print('🔍 Exception in getRoomTypeById: $e');
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
