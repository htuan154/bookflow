import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class OTPService {
  /// Gửi OTP đến email
  static Future<Map<String, dynamic>> sendOTP(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/otp/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'OTP đã được gửi đến email của bạn',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Không thể gửi OTP',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Lỗi kết nối: ${e.toString()}',
      };
    }
  }

  /// Xác thực OTP
  static Future<Map<String, dynamic>> verifyOTP(
    String email,
    String otp,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/otp/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'message': data['message'] ?? 'Xác thực OTP thành công',
          'email': data['email'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'OTP không hợp lệ hoặc đã hết hạn',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Lỗi kết nối: ${e.toString()}',
      };
    }
  }

  /// Reset mật khẩu sau khi verify OTP thành công
  static Future<Map<String, dynamic>> resetPassword(
    String email,
    String newPassword,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/otp/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'newPassword': newPassword,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Đặt lại mật khẩu thành công',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Không thể đặt lại mật khẩu',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Lỗi kết nối: ${e.toString()}',
      };
    }
  }
}
