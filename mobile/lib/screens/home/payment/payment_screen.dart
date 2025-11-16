import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../services/vietqr_service.dart';

class PaymentScreen extends StatefulWidget {
  final String bookingId;
  final String? hotelId;
  final double amount;
  final String paymentMethod; // 'vietqr' hoặc 'payos'
  final String paymentType; // 'booking' hoặc 'walk-in'

  const PaymentScreen({
    super.key,
    required this.bookingId,
    this.hotelId,
    required this.amount,
    this.paymentMethod = 'payos', // Thử PayOS trước, fallback to VietQR nếu fail
    this.paymentType = 'booking',
  });

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final VietQRService _vietqrService = VietQRService();
  
  Map<String, dynamic>? _qrData;
  String _paymentStatus = 'idle'; // 'idle', 'pending', 'paid', 'expired', 'error'
  int? _countdown; // Countdown in seconds
  bool _isLoading = false;
  bool _isConfirming = false;
  String? _errorMessage;
  Timer? _countdownTimer;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _generatePayment();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  // Tạo QR / tạo đơn thanh toán
  Future<void> _generatePayment() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      Map<String, dynamic>? result;
      bool usePayOS = widget.paymentMethod == 'payos';

      if (usePayOS) {
        try {
          // Thử PayOS trước
          print('🔄 Attempting PayOS payment...');
          result = await _vietqrService.createPayOSPayment(
            bookingId: widget.bookingId,
            hotelId: widget.hotelId,
            amount: widget.amount,
            description: 'Thanh toán đơn #${widget.bookingId}',
          );

          print('✅ PayOS Response: $result');

          // Nếu không có QR image, mở checkout URL
          if (result['checkoutUrl'] != null && result['qrCode'] == null) {
            // TODO: Mở checkout URL trong WebView hoặc browser
            print('🔗 Checkout URL: ${result['checkoutUrl']}');
          }
        } catch (payosError) {
          // PayOS fail -> fallback to VietQR
          print('⚠️ PayOS failed, falling back to VietQR: $payosError');
          usePayOS = false;
        }
      }

      if (!usePayOS) {
        // VietQR cũ (fallback hoặc mặc định)
        print('🔄 Using VietQR payment...');
        try {
          if (widget.paymentType == 'booking') {
            result = await _vietqrService.createQRForBooking(widget.bookingId);
          } else {
            result = await _vietqrService.createQRAtCounter(
              hotelId: widget.hotelId!,
              bookingId: widget.bookingId,
              amount: widget.amount,
            );
          }
          print('✅ VietQR Response: $result');
        } catch (vietqrError) {
          print('❌ VietQR payment failed: $vietqrError');
          result = null;
        }
      }

      if (result == null) {
        throw Exception('Không thể tạo thanh toán - Không có response từ PayOS hoặc VietQR');
      }

      // Check nhiều điều kiện để đảm bảo có response hợp lệ
      if (result['ok'] == true || 
          result['booking_id'] != null || 
          result['orderId'] != null ||
          result['qrCode'] != null ||
          result['qr_image'] != null ||
          result['tx_ref'] != null) {
        
        print('✅ Payment created successfully!');
        print('📦 Payment data: tx_ref=${result['tx_ref']}, orderId=${result['orderId']}, qr_image=${result['qr_image'] != null ? "có" : "không"}');
        
        setState(() {
          _qrData = result;
          _paymentStatus = 'pending';
        });
        _startCountdown();
        _startPolling();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tạo thanh toán thành công!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        print('❌ Invalid payment response: $result');
        throw Exception('Không thể tạo thanh toán - Response không hợp lệ');
      }
    } catch (e) {
      print('Error generating payment: $e');
      setState(() {
        _errorMessage = e.toString();
        _paymentStatus = 'error';
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Đếm ngược 10 phút
  void _startCountdown() {
    _countdown = 600; // 10 minutes = 600 seconds
    _countdownTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_countdown! > 0 && _paymentStatus == 'pending') {
        setState(() {
          _countdown = _countdown! - 1;
        });
      } else if (_countdown == 0) {
        setState(() {
          _paymentStatus = 'expired';
        });
        timer.cancel();
        _pollingTimer?.cancel();
      }
    });
  }

  // Polling trạng thái thanh toán
  void _startPolling() {
    _pollingTimer = Timer.periodic(Duration(seconds: 3), (timer) async {
      if (_paymentStatus != 'pending') {
        timer.cancel();
        return;
      }

      try {
        Map<String, dynamic> statusResult;

        // Đã chuẩn hóa trong service, dùng tx_ref cho cả 2 loại
        final txRef = _qrData?['tx_ref'];
        
        if (txRef == null) {
          print('⚠️ No tx_ref found for polling. _qrData: $_qrData');
          return;
        }

        if (widget.paymentMethod == 'payos') {
          print('🔄 Polling PayOS status for order: $txRef');
          statusResult = await _vietqrService.checkPayOSStatus(txRef.toString());
        } else {
          print('🔄 Polling VietQR status for tx_ref: $txRef');
          statusResult = await _vietqrService.checkPaymentStatus(txRef);
        }

        print('📊 Status result: $statusResult');

        // Check nếu đã thanh toán
        if (_vietqrService.isPaymentPaid(statusResult)) {
          setState(() {
            _paymentStatus = 'paid';
          });
          _countdownTimer?.cancel();
          timer.cancel();
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✅ Thanh toán thành công!'),
              backgroundColor: Colors.green,
            ),
          );
          
          // Delay 2 giây rồi quay về màn hình trước
          Future.delayed(Duration(seconds: 2), () {
            if (mounted) {
              Navigator.pop(context, true);
            }
          });
        }
      } catch (e) {
        print('❌ Error polling payment status: $e');
      }
    });
  }

  // Xác nhận thanh toán thủ công (VietQR và PayOS)
  Future<void> _handlePaymentConfirmation() async {
    // Đã chuẩn hóa trong service, chỉ cần dùng tx_ref
    final txRef = _qrData?['tx_ref'];
        
    if (txRef == null) {
      print('❌ Không tìm thấy tx_ref trong _qrData: $_qrData');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không tìm thấy thông tin giao dịch'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    print('🔄 Confirming payment with tx_ref: $txRef');

    setState(() {
      _isConfirming = true;
    });

    try {
      final result = await _vietqrService.updatePaymentStatus(
        txRef: txRef,
        status: 'paid',
        paidAt: DateTime.now().toIso8601String(),
      );

      if (result['ok'] == true) {
        setState(() {
          _paymentStatus = 'paid';
        });
        _countdownTimer?.cancel();
        _pollingTimer?.cancel();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Xác nhận thanh toán thành công!'),
            backgroundColor: Colors.green,
          ),
        );
        
        Future.delayed(Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pop(context, true);
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi xác nhận: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isConfirming = false;
      });
    }
  }

  String _formatCountdown() {
    if (_countdown == null) return '00:00';
    final mins = _countdown! ~/ 60;
    final secs = _countdown! % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VNĐ';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          widget.paymentMethod == 'payos' 
              ? 'Thanh toán PayOS (VietQR)' 
              : 'Thanh toán VietQR',
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 1,
      ),
      body: SafeArea(
        child: _isLoading
            ? Center(child: CircularProgressIndicator(color: Colors.orange))
            : LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    padding: EdgeInsets.all(16),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight - 32,
                      ),
                      child: Column(
                        children: [
                          _buildHeader(),
                          SizedBox(height: 16),
                          if (_qrData != null) ...[
                            _buildQRSection(),
                            SizedBox(height: 16),
                            _buildTransactionInfo(),
                            SizedBox(height: 16),
                            _buildStatusSection(),
                            SizedBox(height: 16),
                            _buildActionButtons(),
                            SizedBox(height: 16),
                            _buildInstructions(),
                          ] else if (_errorMessage != null) ...[
                            _buildErrorSection(),
                          ],
                          SizedBox(height: 16), // Bottom padding
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.payment, size: 32, color: Colors.orange),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Số tiền thanh toán',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                ),
                SizedBox(height: 2),
                Text(
                  _formatPrice(widget.amount),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQRSection() {
    // Thử nhiều key có thể có trong response
    final qrImage = _qrData?['qr_image'] ?? 
                    _qrData?['qrCode'] ?? 
                    _qrData?['qr_code'] ??
                    _qrData?['qrDataURL'];
    
    print('QR Image URL: $qrImage');
    
    if (qrImage == null || qrImage.toString().isEmpty) {
      // Nếu không có QR nhưng có checkout URL
      final checkoutUrl = _qrData?['checkoutUrl'];
      final orderId = _qrData?['orderId'] ?? _qrData?['orderCode'];
      
      return Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.qr_code_scanner, size: 48, color: Colors.orange),
            ),
            SizedBox(height: 16),
            Text(
              'Đơn thanh toán đã được tạo',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Mã đơn: ${orderId ?? 'N/A'}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontFamily: 'monospace',
              ),
            ),
            if (checkoutUrl != null) ...[
              SizedBox(height: 16),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  children: [
                    Icon(Icons.info_outline, size: 20, color: Colors.blue[700]),
                    SizedBox(height: 8),
                    Text(
                      'Link thanh toán:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.blue[900],
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      checkoutUrl,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.blue[700],
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
            SizedBox(height: 16),
            Text(
              'Hệ thống đang chờ bạn thanh toán...',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Quét mã QR để thanh toán',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!, width: 1.5),
              borderRadius: BorderRadius.circular(10),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: qrImage.startsWith('http') 
                ? Image.network(
                    qrImage,
                    width: 220,
                    height: 220,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        width: 220,
                        height: 220,
                        color: Colors.grey[100],
                        child: Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                            color: Colors.orange,
                            strokeWidth: 2,
                          ),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      print('Error loading QR image: $error');
                      return Container(
                        width: 220,
                        height: 220,
                        color: Colors.grey[200],
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 40, color: Colors.red),
                            SizedBox(height: 6),
                            Text(
                              'Không thể tải QR',
                              style: TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ],
                        ),
                      );
                    },
                  )
                : QrImageView(
                    data: qrImage,
                    version: QrVersions.auto,
                    size: 220.0,
                    backgroundColor: Colors.white,
                    errorStateBuilder: (context, error) {
                      print('Error generating QR: $error');
                      return Container(
                        width: 220,
                        height: 220,
                        color: Colors.red[50],
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 40, color: Colors.red),
                            SizedBox(height: 6),
                            Text(
                              'Không thể tạo QR',
                              style: TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionInfo() {
    final txRef = _qrData?['tx_ref'] ?? _qrData?['orderId'];
    
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          _buildInfoRow('Mã giao dịch', txRef?.toString() ?? '-'),
          if (widget.bookingId.isNotEmpty) ...[
            SizedBox(height: 8),
            _buildInfoRow('Booking ID', widget.bookingId),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey[600], fontSize: 13),
        ),
        Flexible(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(
                  value,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    fontFamily: 'monospace',
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              SizedBox(width: 6),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: value));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đã sao chép: $value'),
                      duration: Duration(seconds: 1),
                    ),
                  );
                },
                child: Icon(Icons.copy, size: 14, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusSection() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_paymentStatus == 'pending') ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.orange,
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  'Đang chờ thanh toán...',
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.orange,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            if (_countdown != null) ...[
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Hết hạn sau: ${_formatCountdown()}',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.orange[800],
                    fontWeight: FontWeight.w600,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ],
          ] else if (_paymentStatus == 'paid') ...[
            Icon(Icons.check_circle, size: 40, color: Colors.green),
            SizedBox(height: 6),
            Text(
              '✅ Thanh toán thành công!',
              style: TextStyle(
                fontSize: 15,
                color: Colors.green,
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else if (_paymentStatus == 'expired') ...[
            Icon(Icons.access_time, size: 40, color: Colors.red),
            SizedBox(height: 6),
            Text(
              '⏰ Phiên thanh toán đã hết hạn',
              style: TextStyle(
                fontSize: 15,
                color: Colors.red,
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else if (_paymentStatus == 'error') ...[
            Icon(Icons.error, size: 40, color: Colors.red),
            SizedBox(height: 6),
            Text(
              '❌ Lỗi thanh toán',
              style: TextStyle(
                fontSize: 15,
                color: Colors.red,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        if (_paymentStatus == 'expired' || _paymentStatus == 'error')
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _generatePayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Tạo lại',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        // Nút "Tôi đã chuyển khoản" cho cả VietQR và PayOS khi pending
        if (_paymentStatus == 'pending') ...[
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isConfirming ? null : _handlePaymentConfirmation,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isConfirming
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      '✓ Tôi đã chuyển khoản',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInstructions() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 16, color: Colors.blue[700]),
              SizedBox(width: 6),
              Text(
                'Hướng dẫn thanh toán:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue[900],
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          _buildInstructionStep('1', 'Mở ứng dụng ngân hàng của bạn'),
          SizedBox(height: 4),
          _buildInstructionStep(
            '2',
            widget.paymentMethod == 'payos'
                ? 'Hệ thống sẽ mở trang PayOS, làm theo hướng dẫn'
                : 'Quét mã VietQR và xác nhận chuyển tiền',
          ),
          SizedBox(height: 4),
          _buildInstructionStep(
            '3',
            'Sau khi thanh toán, hệ thống sẽ tự động xác nhận',
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionStep(String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: Colors.blue[600],
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: 12, color: Colors.blue[800], height: 1.3),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorSection() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(
            'Không thể tạo thanh toán',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.red[900],
            ),
          ),
          SizedBox(height: 8),
          Text(
            _errorMessage ?? 'Đã xảy ra lỗi',
            style: TextStyle(fontSize: 14, color: Colors.red[800]),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: _generatePayment,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: Text(
              'Thử lại',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
