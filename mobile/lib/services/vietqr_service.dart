import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'token_service.dart';

class VietQRService {
  final String baseUrl = ApiConfig.baseUrl;

  // =========================================
  // UC01 & UC02: Tạo QR code cho booking có sẵn
  // =========================================
  
  /// Tạo QR code cho booking (trả ngay hoặc check-in)
  /// 
  /// Returns: {booking_id, tx_ref, amount, qr_image, qr_code}
  Future<Map<String, dynamic>> createQRForBooking(String bookingId) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/vietqr/bookings/$bookingId/payments/qr'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Không thể tạo QR cho booking');
      }
    } catch (e) {
      print('Error creating QR for booking: $e');
      rethrow;
    }
  }

  // =========================================
  // UC03: Tạo QR code cho walk-in tại quầy
  // =========================================
  
  /// Tạo QR code cho khách walk-in tại quầy
  /// 
  /// [hotelId]: ID của khách sạn
  /// [bookingId]: ID của booking
  /// [amount]: Số tiền thanh toán
  /// [note]: Ghi chú (optional)
  /// 
  /// Returns: {hotel_id, booking_id, tx_ref, amount, qr_image, qr_code}
  Future<Map<String, dynamic>> createQRAtCounter({
    required String hotelId,
    required String bookingId,
    required double amount,
    String? note,
  }) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/vietqr/hotels/$hotelId/payments/qr'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'bookingId': bookingId,
          'amount': amount,
          'note': note ?? 'VietQR Walk-in',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Không thể tạo QR tại quầy');
      }
    } catch (e) {
      print('Error creating QR at counter: $e');
      rethrow;
    }
  }

  // =========================================
  // Kiểm tra trạng thái thanh toán (polling)
  // =========================================
  
  /// Kiểm tra trạng thái thanh toán theo tx_ref
  /// 
  /// Returns: {tx_ref, status, amount, paid_at, booking_id}
  Future<Map<String, dynamic>> checkPaymentStatus(String txRef) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final response = await http.get(
        Uri.parse('$baseUrl/vietqr/payments/$txRef/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Không thể kiểm tra trạng thái');
      }
    } catch (e) {
      print('Error checking payment status: $e');
      rethrow;
    }
  }

  // =========================================
  // Xác nhận thanh toán (webhook simulation)
  // =========================================
  
  /// Giả lập webhook xác nhận thanh toán (dùng cho demo/test)
  /// 
  /// [txRef]: Transaction reference
  /// [amount]: Số tiền
  /// [paidAt]: Thời gian thanh toán (optional)
  /// [providerTxId]: ID giao dịch từ VietQR (optional)
  /// 
  /// Returns: {ok: true/false}
  Future<Map<String, dynamic>> confirmPayment({
    required String txRef,
    required double amount,
    String? paidAt,
    String? providerTxId,
  }) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/vietqr/webhooks/vietqr'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'tx_ref': txRef,
          'amount': amount,
          'paid_at': paidAt ?? DateTime.now().toIso8601String(),
          'provider_tx_id': providerTxId ?? 'VQR${DateTime.now().millisecondsSinceEpoch}',
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Không thể xác nhận thanh toán');
      }
    } catch (e) {
      print('Error confirming payment: $e');
      rethrow;
    }
  }

  // =========================================
  // Cập nhật trạng thái thanh toán (admin)
  // =========================================
  
  /// Cập nhật trạng thái thanh toán
  /// 
  /// [paymentId]: ID của payment (optional nếu có txRef)
  /// [txRef]: Transaction reference (optional nếu có paymentId)
  /// [status]: Trạng thái mới ('pending', 'paid', 'failed', etc.)
  /// [paidAt]: Thời gian thanh toán (optional)
  /// 
  /// Returns: {ok: true/false, payment: {...}}
  Future<Map<String, dynamic>> updatePaymentStatus({
    String? paymentId,
    String? txRef,
    required String status,
    String? paidAt,
  }) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      if (paymentId == null && txRef == null) {
        throw Exception('Phải cung cấp paymentId hoặc txRef');
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/vietqr/payments/update-status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          if (paymentId != null) 'paymentId': paymentId,
          if (txRef != null) 'txRef': txRef,
          'status': status,
          if (paidAt != null) 'paidAt': paidAt,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Không thể cập nhật trạng thái');
      }
    } catch (e) {
      print('Error updating payment status: $e');
      rethrow;
    }
  }

  // =========================================
  // PayOS: Tạo payment request (polling)
  // =========================================
  
  /// Tạo payment request với PayOS (polling, không webhook)
  /// 
  /// [bookingId]: ID của booking
  /// [hotelId]: ID của khách sạn (optional, sẽ lookup từ booking)
  /// [amount]: Số tiền
  /// [description]: Mô tả thanh toán
  /// 
  /// Returns: {ok, orderId, checkoutUrl, qrCode}
  Future<Map<String, dynamic>> createPayOSPayment({
    required String bookingId,
    String? hotelId,
    required double amount,
    String? description,
  }) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final requestBody = {
        'booking_id': bookingId,
        if (hotelId != null && hotelId.isNotEmpty) 'hotel_id': hotelId,
        'amount': amount,
        'description': description ?? 'Thanh toán đơn #$bookingId',
      };
      
      print('📱 [MOBILE] Sending PayOS request:');
      print('   URL: $baseUrl/vietqr/payos/create');
      print('   Body: ${json.encode(requestBody)}');

      final response = await http.post(
        Uri.parse('$baseUrl/vietqr/payos/create'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(requestBody),
      );

      print('📱 [MOBILE] Response status: ${response.statusCode}');
      print('📱 [MOBILE] Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final result = json.decode(response.body);
        print('✅ [MOBILE] PayOS success: $result');
        
        // Chuẩn hóa response giống Web để dễ sử dụng
        final normalizedResult = {
          'ok': result['ok'] ?? true,
          'tx_ref': result['orderId']?.toString() ?? result['orderCode']?.toString(), // ← Chuẩn hóa key
          'orderId': result['orderId'],
          'orderCode': result['orderCode'],
          'qr_image': result['qrCode'], // qrCode -> qr_image
          'qrCode': result['qrCode'],
          'checkout_url': result['checkoutUrl'],
          'checkoutUrl': result['checkoutUrl'],
          'raw': result,
        };
        
        return normalizedResult;
      } else {
        final error = json.decode(response.body);
        print('❌ [MOBILE] PayOS error: $error');
        throw Exception(error['message'] ?? error['error'] ?? 'Không thể tạo payment PayOS');
      }
    } catch (e) {
      print('❌ [MOBILE] Error creating PayOS payment: $e');
      rethrow;
    }
  }

  // =========================================
  // PayOS: Kiểm tra trạng thái (polling)
  // =========================================
  
  /// Kiểm tra trạng thái payment PayOS
  /// 
  /// Returns: {ok, orderId, gatewayStatus, dbStatus, paid_at, booking_id}
  Future<Map<String, dynamic>> checkPayOSStatus(String orderCode) async {
    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final response = await http.get(
        Uri.parse('$baseUrl/vietqr/payos/status/$orderCode'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Không thể kiểm tra trạng thái PayOS');
      }
    } catch (e) {
      print('Error checking PayOS status: $e');
      rethrow;
    }
  }

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================
  
  /// Tạo payload webhook cho demo/test
  Map<String, dynamic> createWebhookPayload({
    required String txRef,
    required double amount,
    String? providerTxId,
  }) {
    return {
      'tx_ref': txRef,
      'amount': amount,
      'paid_at': DateTime.now().toIso8601String(),
      'provider_tx_id': providerTxId ?? 'VQR${DateTime.now().millisecondsSinceEpoch}',
    };
  }

  /// Kiểm tra QR code đã hết hạn chưa
  /// 
  /// [createdAt]: Thời gian tạo QR
  /// [ttlMinutes]: Thời gian sống của QR (phút)
  /// 
  /// Returns: true nếu đã hết hạn
  bool isQRExpired(DateTime createdAt, {int ttlMinutes = 10}) {
    final now = DateTime.now();
    final diffMinutes = now.difference(createdAt).inMinutes;
    return diffMinutes > ttlMinutes;
  }

  /// Format countdown time (giây -> MM:SS)
  String formatCountdownTime(int seconds) {
    if (seconds <= 0) return '00:00';
    
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  /// Parse status từ response
  String parsePaymentStatus(Map<String, dynamic>? response) {
    if (response == null) return 'unknown';
    
    // VietQR
    if (response.containsKey('status')) {
      return response['status'] as String;
    }
    
    // PayOS
    if (response.containsKey('dbStatus')) {
      return response['dbStatus'] as String;
    }
    
    return 'unknown';
  }

  /// Check nếu thanh toán đã hoàn thành
  bool isPaymentPaid(Map<String, dynamic>? response) {
    final status = parsePaymentStatus(response);
    return status.toLowerCase() == 'paid';
  }

  /// Check nếu thanh toán đang pending
  bool isPaymentPending(Map<String, dynamic>? response) {
    final status = parsePaymentStatus(response);
    return status.toLowerCase() == 'pending';
  }
}
