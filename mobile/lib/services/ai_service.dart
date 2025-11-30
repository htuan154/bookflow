import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'api_config.dart';
import 'auth_service.dart';
import 'token_service.dart';

/// Service cho AI Chatbot, Stream real-time và Upload file
class AiService {
  final AuthService _authService;
  
  // Cache để tránh request trùng lặp
  final Map<String, dynamic> _requestCache = {};
  final Duration _cacheDuration = const Duration(seconds: 2);

  AiService(this._authService);

  // ========== HEADERS ==========
  
  /// Lấy headers cho request (có hoặc không có auth)
  Future<Map<String, String>> _getHeaders({bool requireAuth = false}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      final token = await TokenService.getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // ========== CHATBOT SUGGEST ==========

  /// Gửi message đến AI chatbot và nhận gợi ý
  /// 
  /// [message]: Câu hỏi/yêu cầu của user
  /// [sessionId]: ID phiên chat (tùy chọn, để lưu lịch sử)
  /// [filters]: Bộ lọc tùy chọn (vd: {price_range: [100, 500]})
  /// [topN]: Số lượng kết quả mong muốn
  /// [requireAuth]: Có yêu cầu đăng nhập không
  /// 
  /// Returns: Map chứa kết quả AI hoặc throw Exception
  Future<Map<String, dynamic>> suggest({
    required String message,
    String? sessionId,
    Map<String, dynamic>? filters,
    int? topN,
    bool requireAuth = false,
  }) async {
    // Kiểm tra cache để tránh spam request
    final cacheKey = '$message-$sessionId';
    final cached = _getCachedRequest(cacheKey);
    if (cached != null) {
      debugPrint('[AiService] Sử dụng cached response');
      return cached;
    }

    try {
      // Fix: Backend mount /ai directly, not under /api/v1
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/suggest');
      final headers = await _getHeaders(requireAuth: requireAuth);
      
      final body = {
        'message': message,
        if (sessionId != null) 'session_id': sessionId,
        if (filters != null) 'filters': filters,
        if (topN != null) 'top_n': topN,
      };

      debugPrint('[AiService] Gửi suggest: $message');
      
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        
        // Cache response
        _cacheRequest(cacheKey, data);
        
        debugPrint('[AiService] Nhận response thành công');
        return data;
      } else {
        final errorBody = utf8.decode(response.bodyBytes);
        debugPrint('[AiService] Lỗi ${response.statusCode}: $errorBody');
        throw AiServiceException(
          'Không thể lấy gợi ý từ AI',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Exception: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  // ========== CHAT HISTORY ==========

  /// Lấy danh sách các phiên chat
  Future<List<Map<String, dynamic>>> getChatSessions({
    bool requireAuth = true,
  }) async {
    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/history/sessions');
      final headers = await _getHeaders(requireAuth: requireAuth);

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        debugPrint('[AiService] getChatSessions response: $data');
        // Backend returns {success: true, data: [...]}
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể lấy danh sách phiên chat',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi getChatSessions: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  /// Lấy danh sách tin nhắn trong 1 phiên chat
  Future<List<Map<String, dynamic>>> getChatMessages({
    required String sessionId,
    bool requireAuth = true,
  }) async {
    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse(
        '$baseUrl/ai/history/messages?session_id=$sessionId',
      );
      final headers = await _getHeaders(requireAuth: requireAuth);

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        debugPrint('[AiService] getChatMessages response keys: ${data.keys}');
        // Backend returns {success: true, items: [...], total, page, pageSize}
        return List<Map<String, dynamic>>.from(data['items'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể lấy tin nhắn',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi getChatMessages: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  // ========== HOTELS ==========

  /// Tìm kiếm khách sạn
  Future<List<Map<String, dynamic>>> searchHotels({
    String? query,
    String? city,
    int limit = 20,
  }) async {
    try {
      final params = <String, String>{};
      if (query != null && query.isNotEmpty) params['q'] = query;
      if (city != null && city.isNotEmpty) params['city'] = city;
      params['limit'] = limit.toString();

      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/hotels/search')
          .replace(queryParameters: params);
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return List<Map<String, dynamic>>.from(data['hotels'] ?? data['data'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể tìm kiếm khách sạn',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi searchHotels: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  /// Lấy thông tin chi tiết khách sạn
  Future<Map<String, dynamic>> getHotelDetail(int hotelId) async {
    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/hotels/full/$hotelId');
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      } else {
        throw AiServiceException(
          'Không thể lấy thông tin khách sạn',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi getHotelDetail: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  /// Lấy top khách sạn theo thành phố
  Future<List<Map<String, dynamic>>> getTopHotels({
    required String city,
    int limit = 10,
  }) async {
    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/hotels/top')
          .replace(queryParameters: {
        'city': city,
        'limit': limit.toString(),
      });
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return List<Map<String, dynamic>>.from(data['hotels'] ?? data['data'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể lấy danh sách khách sạn',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi getTopHotels: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  /// Lấy danh sách tỉnh/thành có khách sạn
  Future<List<String>> getHotelCities() async {
    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/hotel-cities');
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return List<String>.from(data['cities'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể lấy danh sách thành phố',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi getHotelCities: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  // ========== PROMOTIONS ==========

  /// Lấy khuyến mãi hôm nay
  Future<List<Map<String, dynamic>>> getPromotionsToday({
    String? city,
    int limit = 50,
  }) async {
    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final endpoint = city != null
          ? '/ai/promotions/today-by-city'
          : '/ai/promotions/today';
      
      final params = <String, String>{'limit': limit.toString()};
      if (city != null) params['city'] = city;

      final url = Uri.parse('$baseUrl$endpoint')
          .replace(queryParameters: params);
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return List<Map<String, dynamic>>.from(data['promotions'] ?? data['data'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể lấy khuyến mãi',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi getPromotionsToday: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  /// Tìm kiếm khuyến mãi theo từ khóa, thành phố, tháng
  Future<List<Map<String, dynamic>>> searchPromotions({
    String? keyword,
    String? city,
    int? year,
    int? month,
    int limit = 50,
  }) async {
    try {
      final params = <String, String>{'limit': limit.toString()};
      if (keyword != null && keyword.isNotEmpty) params['q'] = keyword;
      if (city != null && city.isNotEmpty) params['city'] = city;
      if (year != null) params['year'] = year.toString();
      if (month != null) params['month'] = month.toString();

      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/promotions/search')
          .replace(queryParameters: params);
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return List<Map<String, dynamic>>.from(data['promotions'] ?? data['data'] ?? []);
      } else {
        throw AiServiceException(
          'Không thể tìm kiếm khuyến mãi',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi searchPromotions: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  /// Kiểm tra mã khuyến mãi có áp dụng được không
  Future<Map<String, dynamic>> checkPromoCode({
    required String code,
    required int userId,
    required double bookingAmount,
    DateTime? when,
  }) async {
    try {
      final params = <String, String>{
        'code': code,
        'user_id': userId.toString(),
        'booking_amount': bookingAmount.toString(),
      };
      if (when != null) {
        params['when'] = (when.millisecondsSinceEpoch ~/ 1000).toString();
      }

      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/ai/promotions/check')
          .replace(queryParameters: params);
      final headers = await _getHeaders();

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      } else {
        throw AiServiceException(
          'Không thể kiểm tra mã khuyến mãi',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi checkPromoCode: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối: ${e.toString()}');
    }
  }

  // ========== REAL-TIME STREAM (SSE) ==========

  /// Mở kết nối SSE để nhận tin nhắn real-time từ conversation
  /// 
  /// [conversationId]: ID của conversation cần theo dõi
  /// [onMessage]: Callback khi nhận được tin nhắn mới
  /// [onError]: Callback khi có lỗi
  /// [onDone]: Callback khi stream đóng
  /// 
  /// Returns: StreamSubscription để có thể cancel sau này
  Stream<Map<String, dynamic>> openChatStream({
    required String conversationId,
  }) async* {

    final token = await TokenService.getToken();
    if (token == null || token.isEmpty) {
      throw AiServiceException('Yêu cầu đăng nhập để sử dụng chat stream');
    }

    final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
    final url = Uri.parse(
      '$baseUrl/stream/stream?conversation_id=$conversationId',
    );

    debugPrint('[AiService] Mở SSE stream: $conversationId');

    try {
      final client = http.Client();
      final request = http.Request('GET', url);
      request.headers.addAll({
        'Authorization': 'Bearer $token',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      });

      final response = await client.send(request);

      if (response.statusCode != 200) {
        throw AiServiceException(
          'Không thể mở stream',
          statusCode: response.statusCode,
        );
      }

      // Parse SSE stream
      String buffer = '';
      
      await for (var chunk in response.stream.transform(utf8.decoder)) {
        buffer += chunk;
        final lines = buffer.split('\n');
        buffer = lines.last; // Giữ dòng chưa hoàn chỉnh

        for (var i = 0; i < lines.length - 1; i++) {
          final line = lines[i].trim();
          
          if (line.isEmpty) continue;
          
          // Parse SSE format: "event: type\ndata: json"
          if (line.startsWith('event:')) {
            final eventType = line.substring(6).trim();
            
            // Bỏ qua ping event
            if (eventType == 'ping') continue;
            
            // Đọc data ở dòng tiếp theo
            if (i + 1 < lines.length - 1) {
              final dataLine = lines[i + 1].trim();
              if (dataLine.startsWith('data:')) {
                final jsonStr = dataLine.substring(5).trim();
                try {
                  final data = jsonDecode(jsonStr);
                  yield {
                    'event': eventType,
                    ...data,
                  };
                } catch (e) {
                  debugPrint('[AiService] Lỗi parse SSE data: $e');
                }
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('[AiService] Lỗi stream: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi kết nối stream: ${e.toString()}');
    }
  }

  // ========== FILE UPLOAD ==========

  /// Upload file lên server (GridFS)
  /// 
  /// [file]: File cần upload
  /// [fileName]: Tên file (tùy chọn, mặc định lấy từ file)
  /// 
  /// Returns: Map chứa thông tin file đã upload (gridfs_id, file_name, mime_type, size)
  Future<Map<String, dynamic>> uploadFile({
    required File file,
    String? fileName,
  }) async {

    final token = await TokenService.getToken();
    if (token == null || token.isEmpty) {
      throw AiServiceException('Yêu cầu đăng nhập để upload file');
    }

    try {
      final bytes = await file.readAsBytes();
      final base64File = base64Encode(bytes);
      
      // Lấy MIME type
      String mimeType = 'application/octet-stream';
      final extension = file.path.split('.').last.toLowerCase();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }

      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/uploads');
      final headers = await _getHeaders(requireAuth: true);

      final body = jsonEncode({
        'file_name': fileName ?? file.path.split('/').last,
        'mime_type': mimeType,
        'file_base64': base64File,
      });

      debugPrint('[AiService] Upload file: ${fileName ?? file.path.split('/').last}');

      final response = await http.post(
        url,
        headers: headers,
        body: body,
      ).timeout(const Duration(seconds: 60)); // 60s cho upload

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        debugPrint('[AiService] Upload thành công: ${data['gridfs_id']}');
        return data;
      } else {
        final errorBody = utf8.decode(response.bodyBytes);
        debugPrint('[AiService] Lỗi upload ${response.statusCode}: $errorBody');
        throw AiServiceException(
          'Không thể upload file',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Exception upload: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi upload: ${e.toString()}');
    }
  }

  /// Upload file bằng multipart (nếu backend hỗ trợ)
  /// Hiện tại backend đang dùng JSON base64, hàm này để dự phòng
  Future<Map<String, dynamic>> uploadFileMultipart({
    required File file,
    String? fileName,
  }) async {

    final token = await TokenService.getToken();
    if (token == null || token.isEmpty) {
      throw AiServiceException('Yêu cầu đăng nhập để upload file');
    }

    try {
      final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');
      final url = Uri.parse('$baseUrl/uploads');
      final request = http.MultipartRequest('POST', url);
      
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath(
        'file',
        file.path,
        filename: fileName ?? file.path.split('/').last,
      ));

      debugPrint('[AiService] Upload multipart: ${fileName ?? file.path.split('/').last}');

      final streamedResponse = await request.send()
          .timeout(const Duration(seconds: 60));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        debugPrint('[AiService] Upload thành công: ${data['gridfs_id']}');
        return data;
      } else {
        throw AiServiceException(
          'Không thể upload file',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('[AiService] Exception uploadMultipart: $e');
      if (e is AiServiceException) rethrow;
      throw AiServiceException('Lỗi upload: ${e.toString()}');
    }
  }

  // ========== CACHE MANAGEMENT ==========

  void _cacheRequest(String key, dynamic data) {
    _requestCache[key] = {
      'data': data,
      'timestamp': DateTime.now(),
    };

    // Cleanup cache cũ
    _cleanupCache();
  }

  dynamic _getCachedRequest(String key) {
    final cached = _requestCache[key];
    if (cached == null) return null;

    final timestamp = cached['timestamp'] as DateTime;
    if (DateTime.now().difference(timestamp) > _cacheDuration) {
      _requestCache.remove(key);
      return null;
    }

    return cached['data'];
  }

  void _cleanupCache() {
    if (_requestCache.length > 100) {
      final now = DateTime.now();
      _requestCache.removeWhere((key, value) {
        final timestamp = value['timestamp'] as DateTime;
        return now.difference(timestamp) > _cacheDuration;
      });
    }
  }

  /// Xóa toàn bộ cache
  void clearCache() {
    _requestCache.clear();
    debugPrint('[AiService] Cache đã được xóa');
  }
}

// ========== EXCEPTION ==========

class AiServiceException implements Exception {
  final String message;
  final int? statusCode;

  AiServiceException(this.message, {this.statusCode});

  @override
  String toString() {
    if (statusCode != null) {
      return 'AiServiceException [$statusCode]: $message';
    }
    return 'AiServiceException: $message';
  }
}
