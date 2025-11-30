import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../classes/promotion_model.dart';
import '../../../classes/promotion_detail_model.dart';
import '../../../services/promotion_service.dart';
import '../../../services/promotion_detail_service.dart';

class PromotionScreen extends StatefulWidget {
  final String hotelId;
  final String roomTypeId;
  final double bookingTotal;

  const PromotionScreen({
    super.key,
    required this.hotelId,
    required this.roomTypeId,
    required this.bookingTotal,
  });

  @override
  _PromotionScreenState createState() => _PromotionScreenState();
}

class _PromotionScreenState extends State<PromotionScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _applicablePromotions = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadPromotions();
  }

  Future<void> _loadPromotions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔍 Loading promotions...');
      final result = await PromotionService().getAllPromotions();
      print('📦 Result: $result');

      if (result['success']) {
        final List<dynamic> promotions = result['data'];
        print('✅ Loaded ${promotions.length} promotions');
        final List<Map<String, dynamic>> applicable = [];

        for (var promoJson in promotions) {
          print('🎫 Processing promotion: ${promoJson['promotionId']} - Status: ${promoJson['status']}');
          // Chỉ lấy promotion có status = 'active'
          if (promoJson['status'] != 'active') continue;

          final String? hotelId = promoJson['hotelId'];
          final String promotionType = promoJson['promotionType'] ?? 'general';
          final String promotionId = promoJson['promotionId'];
          
          print('  - HotelId: $hotelId, Type: $promotionType');
          print('  - Current hotelId: ${widget.hotelId}');

          // Case 1: Hotel ID là null (promotion chung cho tất cả)
          if (hotelId == null) {
            print('  ✅ Case 1: System-wide promotion');
            applicable.add({
              'promotion': promoJson,
              'details': null,
            });
            continue;
          }

          // Case 2: Hotel ID khớp
          if (hotelId == widget.hotelId) {
            print('  ✅ Hotel ID matches');
            // Case 2a: Promotion type là 'general'
            if (promotionType == 'general') {
              print('  ✅ Case 2a: General promotion');
              applicable.add({
                'promotion': promoJson,
                'details': null,
              });
            }
            // Case 2b: Promotion type là 'room_specific'
            else if (promotionType == 'room_specific') {
              print('  🔍 Case 2b: Room-specific, loading details...');
              // Load promotion details
              final detailsResult =
                  await PromotionDetailService().getDetailsForPromotion(promotionId);
              print('  📦 Details result: $detailsResult');

              if (detailsResult['success']) {
                final List<dynamic> details = detailsResult['data'];
                print('  📋 Loaded ${details.length} details');

                // Lọc chi tiết khớp với roomTypeId
                final matchingDetails = details
                    .where((detail) {
                      print('    - Detail roomTypeId: ${detail['roomTypeId']} vs ${widget.roomTypeId}');
                      return detail['roomTypeId'] == widget.roomTypeId;
                    })
                    .toList();
                print('  🎯 Found ${matchingDetails.length} matching details');

                if (matchingDetails.isNotEmpty) {
                  applicable.add({
                    'promotion': promoJson,
                    'details': matchingDetails,
                  });
                }
              } else {
                print('  ❌ Failed to load details: ${detailsResult['message']}');
              }
            }
          } else {
            print('  ❌ Hotel ID mismatch');
          }
        }

        print('🎉 Total applicable promotions: ${applicable.length}');
        setState(() {
          _applicablePromotions = applicable;
          _isLoading = false;
        });
      } else {
        print('❌ Failed to load promotions: ${result['message']}');
        setState(() {
          _errorMessage = result['message'] ?? 'Không thể tải danh sách khuyến mãi';
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Exception: $e');
      setState(() {
        _errorMessage = 'Lỗi: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Chọn mã giảm giá', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        elevation: 1,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline, size: 64, color: Colors.red),
                        SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red),
                        ),
                        SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadPromotions,
                          child: Text('Thử lại'),
                        ),
                      ],
                    ),
                  ),
                )
              : _applicablePromotions.isEmpty
                  ? Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.local_offer_outlined,
                                size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              'Không có mã giảm giá khả dụng',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.all(16),
                      itemCount: _applicablePromotions.length,
                      itemBuilder: (context, index) {
                        final item = _applicablePromotions[index];
                        final promoJson = item['promotion'];
                        final details = item['details'];

                        return _buildPromotionCard(promoJson, details);
                      },
                    ),
    );
  }

  Widget _buildPromotionCard(
    Map<String, dynamic> promoJson,
    List<dynamic>? details,
  ) {
    final String code = promoJson['code'] ?? '';
    final String name = promoJson['name'] ?? '';
    final String description = promoJson['description'] ?? '';
    final double discountValue = _parseDouble(promoJson['discountValue']);
    final double? minBookingPrice = promoJson['minBookingPrice'] != null
        ? _parseDouble(promoJson['minBookingPrice'])
        : null;
    final double? maxDiscountAmount = promoJson['maxDiscountAmount'] != null
        ? _parseDouble(promoJson['maxDiscountAmount'])
        : null;
    final DateTime validUntil = DateTime.parse(promoJson['validUntil']);
    final String promotionType = promoJson['promotionType'] ?? 'general';
    final int daysRemaining = validUntil.difference(DateTime.now()).inDays;

    // Kiểm tra có đủ điều kiện áp dụng không
    final bool canApply = minBookingPrice == null || widget.bookingTotal >= minBookingPrice;

    return Container(
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: canApply ? Colors.orange : Colors.grey[300]!,
          width: canApply ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: canApply
              ? () {
                  Navigator.pop(context, {
                    'promotion': promoJson,
                    'details': details,
                  });
                }
              : null,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header với code và discount
                  // Sửa UI: code và giảm giá xuống hàng, tên promotion xuống hàng
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: canApply
                                  ? Colors.orange.withOpacity(0.1)
                                  : Colors.grey[200],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: canApply
                                    ? Colors.orange
                                    : Colors.grey[400]!,
                              ),
                            ),
                            child: Text(
                              code,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: canApply ? Colors.orange : Colors.grey[600],
                              ),
                            ),
                          ),
                          if (promotionType == 'room_specific') ...[
                            SizedBox(width: 8),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Áp dụng theo phòng',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Giảm ${_formatDiscount(discountValue, details)}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: canApply ? Colors.orange : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Tên promotion xuống hàng riêng
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),

                if (description.isNotEmpty) ...[
                  SizedBox(height: 8),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],

                SizedBox(height: 12),

                // Điều kiện
                if (minBookingPrice != null) ...[
                  Row(
                    children: [
                      Icon(
                        canApply ? Icons.check_circle : Icons.info_outline,
                        size: 16,
                        color: canApply ? Colors.green : Colors.orange,
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Đơn tối thiểu: ${_formatPrice(minBookingPrice)}',
                        style: TextStyle(
                          fontSize: 13,
                          color: canApply ? Colors.green : Colors.orange,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                ],

                if (maxDiscountAmount != null) ...[
                  Row(
                    children: [
                      Icon(Icons.arrow_downward, size: 16, color: Colors.grey[600]),
                      SizedBox(width: 6),
                      Text(
                        'Giảm tối đa: ${_formatPrice(maxDiscountAmount)}',
                        style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                ],

                // Chi tiết room specific
                if (details != null && details.isNotEmpty) ...[
                  Divider(height: 16, color: Colors.grey[300]),
                  ...details.map((detail) {
                    final String discountType = detail['discountType'] ?? 'percentage';
                    final double detailValue = _parseDouble(detail['discountValue']);
                    return Padding(
                      padding: EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Icon(Icons.bed, size: 16, color: Colors.blue[700]),
                          SizedBox(width: 6),
                          Text(
                            'Áp dụng cho phòng này: ',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[700],
                            ),
                          ),
                          Text(
                            discountType == 'percentage'
                                ? '${detailValue.toStringAsFixed(0)}%'
                                : _formatPrice(detailValue),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],

                Divider(height: 16, color: Colors.grey[300]),

                // Thời hạn
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    SizedBox(width: 6),
                    Text(
                      daysRemaining > 0
                          ? 'Còn $daysRemaining ngày'
                          : 'Hết hạn hôm nay',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                    Spacer(),
                    if (canApply)
                      Text(
                        'Áp dụng →',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange,
                        ),
                      )
                    else
                      Text(
                        'Không đủ điều kiện',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDiscount(double value, List<dynamic>? details) {
    if (details != null && details.isNotEmpty) {
      // Nếu có details, hiển thị theo detail đầu tiên
      final detail = details.first;
      final String discountType = detail['discountType'] ?? 'percentage';
      final double detailValue = _parseDouble(detail['discountValue']);

      if (discountType == 'percentage') {
        return '${detailValue.toStringAsFixed(0)}%';
      } else {
        return _formatPrice(detailValue);
      }
    }

    // Mặc định hiển thị percentage
    return '${value.toStringAsFixed(0)}%';
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      try {
        return double.parse(value);
      } catch (e) {
        return 0.0;
      }
    }
    return 0.0;
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VNĐ';
  }
}
