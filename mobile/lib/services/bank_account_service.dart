import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';
import '../classes/bank_account_model.dart';

class BankAccountService {
  static final BankAccountService _instance = BankAccountService._internal();
  factory BankAccountService() => _instance;
  BankAccountService._internal();

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  Map<String, String> _headersWithToken(String token) => {
    ..._headers,
    'Authorization': 'Bearer $token',
  };

  /// Lấy danh sách ngân hàng phổ biến
  Future<List<dynamic>> getPopularBanks({int limit = 20}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts/popular-banks?limit=$limit');
    final response = await http.get(url, headers: _headers);
    final body = jsonDecode(response.body);
    if (response.statusCode == 200 && body['success'] == true) {
      return body['data'] ?? [];
    }
    throw Exception(body['message'] ?? 'Không thể lấy danh sách ngân hàng phổ biến');
  }

  /// Tạo tài khoản ngân hàng mới
  Future<Map<String, dynamic>> createBankAccount(Map<String, dynamic> data, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts');
    final response = await http.post(
      url,
      headers: _headersWithToken(token),
      body: jsonEncode(data),
    );
    return _parseResponse(response);
  }

  /// Lấy danh sách tài khoản ngân hàng của user hiện tại
  Future<List<BankAccount>> getUserBankAccounts(String token, {String? hotelId, String? status, bool includeInactive = false}) async {
    final params = <String, String>{};
    if (hotelId != null) params['hotel_id'] = hotelId;
    if (status != null) params['status'] = status;
    if (includeInactive) params['include_inactive'] = 'true';
    final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts${query.isNotEmpty ? '?$query' : ''}');
    final response = await http.get(url, headers: _headersWithToken(token));
    final body = jsonDecode(response.body);
    if (response.statusCode == 200 && body['success'] == true) {
      return (body['data'] as List).map((e) => BankAccount.fromJson(e)).toList();
    }
    throw Exception(body['message'] ?? 'Không thể lấy danh sách tài khoản ngân hàng');
  }

  /// Lấy danh sách tài khoản ngân hàng của hotel
  Future<List<BankAccount>> getHotelBankAccounts(String hotelId, String token, {String? status, bool includeInactive = false}) async {
    final params = <String, String>{};
    if (status != null) params['status'] = status;
    if (includeInactive) params['include_inactive'] = 'true';
    final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    final url = Uri.parse('${ApiConfig.baseUrl}/hotels/$hotelId/bank-accounts${query.isNotEmpty ? '?$query' : ''}');
    final response = await http.get(url, headers: _headersWithToken(token));
    final body = jsonDecode(response.body);
    if (response.statusCode == 200 && body['success'] == true) {
      return (body['data'] as List).map((e) => BankAccount.fromJson(e)).toList();
    }
    throw Exception(body['message'] ?? 'Không thể lấy danh sách tài khoản ngân hàng của khách sạn');
  }

  /// Lấy tài khoản ngân hàng mặc định
  Future<BankAccount?> getDefaultBankAccount(String token, {String? hotelId}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts/default${hotelId != null ? '?hotel_id=$hotelId' : ''}');
    final response = await http.get(url, headers: _headersWithToken(token));
    final body = jsonDecode(response.body);
    if (response.statusCode == 200 && body['success'] == true) {
      if (body['data'] == null) return null;
      return BankAccount.fromJson(body['data']);
    }
    throw Exception(body['message'] ?? 'Không thể lấy tài khoản ngân hàng mặc định');
  }

  /// Lấy thông tin tài khoản ngân hàng theo ID
  Future<BankAccount> getBankAccountById(String id, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts/$id');
    final response = await http.get(url, headers: _headersWithToken(token));
    final body = jsonDecode(response.body);
    if (response.statusCode == 200 && body['success'] == true) {
      return BankAccount.fromJson(body['data']);
    }
    throw Exception(body['message'] ?? 'Không thể lấy thông tin tài khoản ngân hàng');
  }

  /// Cập nhật thông tin tài khoản ngân hàng
  Future<Map<String, dynamic>> updateBankAccount(String id, Map<String, dynamic> data, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts/$id');
    final response = await http.put(
      url,
      headers: _headersWithToken(token),
      body: jsonEncode(data),
    );
    return _parseResponse(response);
  }

  /// Đặt tài khoản làm mặc định
  Future<Map<String, dynamic>> setAsDefault(String id, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts/$id/set-default');
    final response = await http.put(
      url,
      headers: _headersWithToken(token),
    );
    return _parseResponse(response);
  }

  /// Xóa tài khoản ngân hàng (soft delete)
  Future<Map<String, dynamic>> deleteBankAccount(String id, String token) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/bank-accounts/$id');
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
