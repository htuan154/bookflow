import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../classes/user_model.dart';

class UserService {
  static const String _userKey = 'user_data';

  // Lưu thông tin user vào SharedPreferences
  static Future<void> saveUser(User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = jsonEncode(user.toJson());
      await prefs.setString(_userKey, userJson);
      print('User data saved successfully');
    } catch (e) {
      print('Error saving user data: $e');
    }
  }

  // Lấy thông tin user từ SharedPreferences
  static Future<User?> getUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userKey);
      if (userJson != null) {
        final userMap = jsonDecode(userJson);
        return User.fromJson(userMap);
      }
    } catch (e) {
      print('Error getting user data: $e');
    }
    return null;
  }

  // Xóa thông tin user
  static Future<void> clearUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
      print('User data cleared');
    } catch (e) {
      print('Error clearing user data: $e');
    }
  }

  // Kiểm tra xem có user data không
  static Future<bool> hasUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey(_userKey);
    } catch (e) {
      print('Error checking user data: $e');
      return false;
    }
  }
}
