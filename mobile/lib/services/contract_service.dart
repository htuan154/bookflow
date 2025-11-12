import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class ContractService {
  final String baseUrl = ApiConfig.baseUrl;

  // Lấy tất cả hợp đồng (admin hoặc hotel_owner)
  Future<List<dynamic>> getAllContracts() async {
    final token = await TokenService.getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/contracts'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể lấy danh sách hợp đồng');
    }
  }

  // Lấy hợp đồng theo ID
  Future<Map<String, dynamic>> getContractById(String contractId) async {
    final token = await TokenService.getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/contracts/$contractId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không tìm thấy hợp đồng');
    }
  }

  // Lấy hợp đồng của 1 khách sạn
  Future<List<dynamic>> getContractsByHotel(String hotelId) async {
    final token = await TokenService.getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/hotels/$hotelId/contracts'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể lấy hợp đồng của khách sạn');
    }
  }

  // Lấy hợp đồng đang hoạt động của 1 khách sạn
  Future<Map<String, dynamic>?> getActiveContractByHotel(String hotelId) async {
    final token = await TokenService.getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/hotels/$hotelId/contracts/active'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không tìm thấy hợp đồng đang hoạt động');
    }
  }

  // Tạo hợp đồng mới
  Future<Map<String, dynamic>> createContract(Map<String, dynamic> contractData) async {
    final token = await TokenService.getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/contracts'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(contractData),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể tạo hợp đồng');
    }
  }

  // Cập nhật hợp đồng
  Future<Map<String, dynamic>> updateContract(String contractId, Map<String, dynamic> updateData) async {
    final token = await TokenService.getToken();
    final response = await http.patch(
      Uri.parse('$baseUrl/contracts/$contractId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(updateData),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể cập nhật hợp đồng');
    }
  }

  // Xóa hợp đồng
  Future<void> deleteContract(String contractId) async {
    final token = await TokenService.getToken();
    final response = await http.delete(
      Uri.parse('$baseUrl/contracts/$contractId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode != 200) {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể xóa hợp đồng');
    }
  }

  // Cập nhật trạng thái hợp đồng (admin)
  Future<Map<String, dynamic>> updateContractStatus(String contractId, Map<String, dynamic> statusData) async {
    final token = await TokenService.getToken();
    final response = await http.patch(
      Uri.parse('$baseUrl/contracts/$contractId/status'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(statusData),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể cập nhật trạng thái hợp đồng');
    }
  }

  // Lấy hợp đồng theo trạng thái (admin)
  Future<List<dynamic>> getContractsByStatus(String status) async {
    final token = await TokenService.getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/contracts/status/$status'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể lấy hợp đồng theo trạng thái');
    }
  }

  // Gửi duyệt hợp đồng (hotel_owner)
  Future<Map<String, dynamic>> sendForApproval(String contractId) async {
    final token = await TokenService.getToken();
    final response = await http.patch(
      Uri.parse('$baseUrl/contracts/$contractId/send-for-approval'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception(json.decode(response.body)['error'] ?? 'Không thể gửi duyệt hợp đồng');
    }
  }
}
