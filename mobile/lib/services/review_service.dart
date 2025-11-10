import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class ReviewService {
  static final ReviewService _instance = ReviewService._internal();
  factory ReviewService() => _instance;
  ReviewService._internal();

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  Map<String, String> _headersWithToken(String token) => {
    ..._headers,
    'Authorization': 'Bearer $token',
  };

  /// Lấy tất cả đánh giá của một khách sạn
  /// GET /api/v1/reviews/:hotelId
  Future<Map<String, dynamic>> getReviewsForHotel(String hotelId) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$hotelId');
    final response = await http.get(url, headers: _headers);
    return _parseResponse(response);
  }

  /// Lấy review theo bookingId
  /// GET /api/v1/reviews/booking/:bookingId
  Future<Map<String, dynamic>> getReviewByBookingId(String bookingId) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews/booking/$bookingId');
    final response = await http.get(url, headers: _headers);
    return _parseResponse(response);
  }

  /// Tạo mới một review
  /// POST /api/v1/reviews
  Future<Map<String, dynamic>> createReview(Map<String, dynamic> reviewData, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews');
    final response = await http.post(
      url,
      headers: _headersWithToken(token),
      body: jsonEncode(reviewData),
    );
    return _parseResponse(response);
  }

  /// Cập nhật các trường rating phụ cho review (yêu cầu token đăng nhập)
  /// PATCH /api/v1/reviews/:reviewId/ratings
  Future<Map<String, dynamic>> updateSubRatings(String reviewId, Map<String, dynamic> ratings, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/ratings');
    final response = await http.patch(
      url,
      headers: _headersWithToken(token),
      body: jsonEncode(ratings),
    );
    return _parseResponse(response);
  }

  /// Xóa một review
  /// DELETE /api/v1/reviews/:reviewId
  Future<Map<String, dynamic>> deleteReview(String reviewId, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId');
    final response = await http.delete(
      url,
      headers: _headersWithToken(token),
    );
    return _parseResponse(response);
  }

  Map<String, dynamic> _parseResponse(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          'success': true,
          'statusCode': response.statusCode,
          'data': body['data'],
          'message': body['message'] ?? 'Success',
        };
      } else {
        return {
          'success': false,
          'statusCode': response.statusCode,
          'data': null,
          'message': body['message'] ?? 'Đã xảy ra lỗi',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'statusCode': response.statusCode,
        'data': null,
        'message': 'Lỗi không xác định hoặc không thể phân tích phản hồi',
      };
    }
  }
}

class ReviewImageService {
  static final ReviewImageService _instance = ReviewImageService._internal();
  factory ReviewImageService() => _instance;
  ReviewImageService._internal();

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  Map<String, String> _headersWithToken(String token) => {
    ..._headers,
    'Authorization': 'Bearer $token',
  };

  /// Lấy tất cả hình ảnh của một review
  /// GET /api/v1/reviews/:reviewId/images
  Future<Map<String, dynamic>> getReviewImages(String reviewId, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/images');
    final response = await http.get(
      url,
      headers: _headersWithToken(token),
    );
    return _parseResponse(response);
  }

  /// Upload hình ảnh cho một review
  /// POST /api/v1/reviews/:reviewId/images
  Future<Map<String, dynamic>> uploadReviewImages(String reviewId, List<String> imageUrls, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/images');
    final response = await http.post(
      url,
      headers: _headersWithToken(token),
      body: jsonEncode({'image_urls': imageUrls}),
    );
    return _parseResponse(response);
  }

  /// Xóa một hình ảnh review
  /// DELETE /api/v1/review-images/:imageId
  Future<Map<String, dynamic>> deleteReviewImage(String imageId, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/review-images/$imageId');
    final response = await http.delete(
      url,
      headers: _headersWithToken(token),
    );
    return _parseResponse(response);
  }

  Map<String, dynamic> _parseResponse(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          'success': true,
          'statusCode': response.statusCode,
          'data': body['data'],
          'message': body['message'] ?? 'Success',
        };
      } else {
        return {
          'success': false,
          'statusCode': response.statusCode,
          'data': null,
          'message': body['message'] ?? 'Đã xảy ra lỗi',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'statusCode': response.statusCode,
        'data': null,
        'message': 'Lỗi không xác định hoặc không thể phân tích phản hồi',
      };
    }
  }
}
