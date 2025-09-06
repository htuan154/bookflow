import 'dart:convert';
import 'package:http/http.dart' as http;
import '../classes/user_model.dart';
import 'api_config.dart';

class AuthService {
  // Singleton pattern
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // Headers mặc định
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Cập nhật thông tin người dùng
  Future<Map<String, dynamic>> updateUser({
    required String userId,
    required String email,
    required String fullName,
    required String phoneNumber,
    required String address,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId');
      final headers = Map<String, String>.from(_headers);
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      final body = {
        'email': email,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'address': address,
      };
      final response = await http.patch(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Cập nhật thành công',
          'user': responseData['data'] != null
              ? User.fromJson(responseData['data'])
              : null,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Cập nhật thất bại',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Đăng ký tài khoản
  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/auth/register');

      final body = {
        'username': username,
        'email': email,
        'password': password,
        'fullName': fullName,
      };

      final response = await http.post(
        url,
        headers: _headers,
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Registration successful',
          'user': responseData['data']?['user'] != null
              ? User.fromJson(responseData['data']['user'])
              : null,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Đăng nhập
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/auth/login');
      print('Login URL: $url');

      // Server yêu cầu field 'identifier' thay vì 'email'
      final body = {'identifier': email, 'password': password};
      print('Login body: $body');

      final response = await http.post(
        url,
        headers: _headers,
        body: jsonEncode(body),
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Login successful',
          'user': responseData['data']?['user'] != null
              ? User.fromJson(responseData['data']['user'])
              : null,
          'token': responseData['data']?['token'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Login failed',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      print('Login exception: $e');
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Đăng nhập với username hoặc email
  Future<Map<String, dynamic>> loginWithUsernameOrEmail({
    required String usernameOrEmail,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/auth/login');

      // Server sử dụng field 'identifier' cho cả username và email
      final body = {
        'identifier': usernameOrEmail, // Server nhận identifier
        'password': password,
      };

      final response = await http.post(
        url,
        headers: _headers,
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Login successful',
          'user': responseData['data']?['user'] != null
              ? User.fromJson(responseData['data']['user'])
              : null,
          'token': responseData['data']?['token'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Lấy thông tin profile
  Future<Map<String, dynamic>> getProfile(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/auth/profile');

      final headers = Map<String, String>.from(_headers);
      headers['Authorization'] = 'Bearer $token';

      final response = await http.get(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'user': responseData['data']?['user'] != null
              ? User.fromJson(responseData['data']['user'])
              : null,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to get profile',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Đăng xuất
  Future<Map<String, dynamic>> logout(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/auth/logout');

      final headers = Map<String, String>.from(_headers);
      headers['Authorization'] = 'Bearer $token';

      final response = await http.post(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Logout successful',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Logout failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
