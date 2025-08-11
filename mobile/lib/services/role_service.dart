import 'dart:convert';
import 'package:http/http.dart' as http;
import '../classes/role_model.dart';
import 'api_config.dart';

class RoleService {
  // Singleton pattern
  static final RoleService _instance = RoleService._internal();
  factory RoleService() => _instance;
  RoleService._internal();

  // Headers mặc định với token
  Map<String, String> _getHeaders(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // Lấy tất cả roles
  Future<Map<String, dynamic>> getAllRoles(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roles');

      final response = await http.get(url, headers: _getHeaders(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Role> roles = [];
        if (responseData['data'] != null &&
            responseData['data']['roles'] != null) {
          roles = (responseData['data']['roles'] as List)
              .map((roleJson) => Role.fromJson(roleJson))
              .toList();
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Roles retrieved successfully',
          'roles': roles,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to get roles',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Tạo role mới
  Future<Map<String, dynamic>> createRole({
    required String token,
    required String roleName,
    String? roleDescription,
    bool isActive = true,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roles');

      final body = {'roleName': roleName, 'isActive': isActive};

      if (roleDescription != null) body['roleDescription'] = roleDescription;

      final response = await http.post(
        url,
        headers: _getHeaders(token),
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Role created successfully',
          'role': responseData['data']?['role'] != null
              ? Role.fromJson(responseData['data']['role'])
              : null,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to create role',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Lấy role theo ID
  Future<Map<String, dynamic>> getRoleById(String token, int roleId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roles/$roleId');

      final response = await http.get(url, headers: _getHeaders(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'role': responseData['data']?['role'] != null
              ? Role.fromJson(responseData['data']['role'])
              : null,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Role not found',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Cập nhật role
  Future<Map<String, dynamic>> updateRole({
    required String token,
    required int roleId,
    String? roleName,
    String? roleDescription,
    bool? isActive,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roles/$roleId');

      final body = <String, dynamic>{};
      if (roleName != null) body['roleName'] = roleName;
      if (roleDescription != null) body['roleDescription'] = roleDescription;
      if (isActive != null) body['isActive'] = isActive;

      final response = await http.put(
        url,
        headers: _getHeaders(token),
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Role updated successfully',
          'role': responseData['data']?['role'] != null
              ? Role.fromJson(responseData['data']['role'])
              : null,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to update role',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Xóa role
  Future<Map<String, dynamic>> deleteRole(String token, int roleId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/roles/$roleId');

      final response = await http.delete(url, headers: _getHeaders(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Role deleted successfully',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to delete role',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
