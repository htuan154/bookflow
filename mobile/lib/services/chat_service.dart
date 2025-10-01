import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  final String _baseUrl = '${ApiConfig.baseUrl}/chats';

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Gửi tin nhắn mới
  // POST /api/v1/chats
  Future<Map<String, dynamic>> sendMessage({
    required String bookingId,
    required String message,
  }) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Vui lòng đăng nhập lại'};
      }

      final headers = {..._headers, 'Authorization': 'Bearer $token'};

      final requestBody = {'booking_id': bookingId, 'message_content': message};

      print('🔍 Chat API Debug - Sending request:');
      print('🔍 URL: $_baseUrl');
      print('🔍 Headers: $headers');
      print('🔍 Body: ${json.encode(requestBody)}');

      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: headers,
        body: json.encode(requestBody),
      );

      print('🔍 Chat API Debug - Response:');
      print('🔍 Status Code: ${response.statusCode}');
      print('🔍 Response Body: ${response.body}');

      final responseData = json.decode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'] ?? 'Gửi tin nhắn thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi gửi tin nhắn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // Lấy lịch sử chat của booking
  // GET /api/v1/chats/booking/:bookingId
  Future<Map<String, dynamic>> getChatHistory(String bookingId) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Vui lòng đăng nhập lại'};
      }

      final headers = {..._headers, 'Authorization': 'Bearer $token'};

      print('🔍 Chat History API Debug - Request:');
      print('🔍 URL: $_baseUrl/booking/$bookingId');
      print('🔍 Headers: $headers');

      final response = await http.get(
        Uri.parse('$_baseUrl/booking/$bookingId'),
        headers: headers,
      );

      print('🔍 Chat History API Debug - Response:');
      print('🔍 Status Code: ${response.statusCode}');
      print('🔍 Response Body: ${response.body}');

      final responseData = json.decode(response.body);
      print('🔍 Parsed responseData: $responseData');
      print('🔍 responseData["data"]: ${responseData['data']}');

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': responseData['data'],
          'message': responseData['message'] ?? 'Tải lịch sử thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tải lịch sử chat',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
