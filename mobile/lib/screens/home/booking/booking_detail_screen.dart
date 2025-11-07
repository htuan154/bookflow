import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../classes/room_type_model.dart';
import '../../../classes/season_pricing_model.dart';
import '../../../services/booking_service.dart';
import '../../../services/user_service.dart';
import '../../../services/booking_nightly_price_service.dart';
import '../../../classes/user_model.dart';
import '../../../classes/hotel_model.dart';
import '../../../classes/booking_nightly_price_model.dart';

class BookingDetailScreen extends StatefulWidget {
  final Hotel hotel; // Thêm dòng này
  final RoomType roomType;
  final Map<String, dynamic>? calculatedRoom;
  final double? calculatedPrice;
  final List<SeasonalPricing>? seasonalPricings;
  final Map<String, dynamic>? searchParams;

  const BookingDetailScreen({
    super.key,
    required this.hotel, // Thêm dòng này
    required this.roomType,
    this.calculatedRoom,
    this.calculatedPrice,
    this.seasonalPricings,
    this.searchParams,
  });

  @override
  _BookingDetailScreenState createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _specialRequestsController = TextEditingController();

  // User info controllers
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _nationalIdController = TextEditingController();

  bool _isLoading = false;
  bool _agreeToTerms = false;

  User? _user;
  List<BookingNightlyPrice> _nightlyPrices = [];

  String _selectedPaymentMethod = 'credit_card'; // Mặc định

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    _calculateNightlyPrices();
  }

  @override
  void dispose() {
    _specialRequestsController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _nationalIdController.dispose();
    super.dispose();
  }

  Future<void> _loadUserInfo() async {
    // Lấy thông tin user từ token hoặc local storage nếu có
    try {
      final user = await UserService.getUser();
      if (user != null) {
        setState(() {
          _user = user;
        });
      }
    } catch (e) {
      print('Error loading user info: $e');
    }
  }

  /// Tính giá từng đêm dựa vào seasonal pricing
  void _calculateNightlyPrices() {
    final checkInDate = widget.searchParams?['checkInDate'];
    final checkOutDate = widget.searchParams?['checkOutDate'];
    final roomCount = widget.calculatedRoom?['requiredRooms'] ?? 1;

    if (checkInDate == null || checkOutDate == null) return;

    final checkIn = DateTime.parse(checkInDate);
    final checkOut = DateTime.parse(checkOutDate);
    final nights = checkOut.difference(checkIn).inDays;

    List<BookingNightlyPrice> prices = [];

    for (int i = 0; i < nights; i++) {
      final stayDate = checkIn.add(Duration(days: i));
      final baseRate = widget.roomType.basePrice;
      
      // Tìm seasonal pricing áp dụng cho ngày này
      SeasonalPricing? applicableSeason;
      if (widget.seasonalPricings != null) {
        for (var season in widget.seasonalPricings!) {
          if (season.isDateInRange(stayDate)) {
            applicableSeason = season;
            break;
          }
        }
      }

      final seasonMultiplier = applicableSeason?.priceModifier ?? 1.0;
      final grossNightlyPrice = baseRate * seasonMultiplier;
      final grossNightlyTotal = grossNightlyPrice * roomCount;

      // Tạo temporary model để hiển thị (chưa có priceId vì chưa lưu DB)
      prices.add(BookingNightlyPrice(
        priceId: '', // Temporary
        bookingId: '', // Temporary
        roomTypeId: widget.roomType.roomTypeId ?? '',
        stayDate: stayDate,
        quantity: roomCount,
        baseRate: baseRate,
        seasonPricingId: applicableSeason?.pricingId,
        seasonMultiplier: seasonMultiplier,
        grossNightlyPrice: grossNightlyPrice,
        grossNightlyTotal: grossNightlyTotal,
        createdAt: DateTime.now(),
      ));
    }

    setState(() {
      _nightlyPrices = prices;
    });
  }

  Widget _buildHotelInfo() {
    final hotel = widget.hotel;
    return Container(
      padding: EdgeInsets.all(20),
      margin: EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.apartment, color: Colors.orange, size: 24),
              SizedBox(width: 8),
              Text(
                'Khách sạn',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          _buildInfoRow('Tên', hotel.name ?? ''),
          _buildInfoRow('Địa chỉ', hotel.address ?? ''),
          _buildInfoRow('Thành phố', hotel.city ?? ''),
          _buildInfoRow('Số điện thoại', hotel.phoneNumber ?? ''),
          _buildInfoRow('Email', hotel.email ?? ''),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodSelector() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.payment, color: Colors.purple, size: 24),
              SizedBox(width: 8),
              Text(
                'Phương thức thanh toán',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedPaymentMethod,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: [
              DropdownMenuItem(
                value: 'credit_card',
                child: Text('Thẻ tín dụng'),
              ),
              DropdownMenuItem(
                value: 'cash',
                child: Text('Tiền mặt tại khách sạn'),
              ),
            ],
            onChanged: (value) {
              setState(() {
                _selectedPaymentMethod = value ?? 'credit_card';
              });
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Xác nhận đặt phòng'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 1,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHotelInfo(),
                    _buildBookingSummary(),
                    SizedBox(height: 24),
                    _buildNightlyPricesBreakdown(),
                    SizedBox(height: 24),
                    _buildUserInfoForm(),
                    SizedBox(height: 24),
                    _buildPaymentMethodSelector(), // Thêm dòng này
                    SizedBox(height: 24),
                    _buildSpecialRequests(),
                    SizedBox(height: 24),
                    _buildTermsAndConditions(),
                    SizedBox(height: 100), // Space for bottom button
                  ],
                ),
              ),
            ),
          ),
          _buildBottomBookingBar(),
        ],
      ),
    );
  }

  Widget _buildBookingSummary() {
    final checkInDate = widget.searchParams?['checkInDate'];
    final checkOutDate = widget.searchParams?['checkOutDate'];
    final guestCount = widget.searchParams?['guestCount'] ?? 1;
    final roomCount = widget.calculatedRoom?['requiredRooms'] ?? 1;

    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.hotel, color: Colors.orange, size: 24),
              SizedBox(width: 8),
              Text(
                'Thông tin đặt phòng',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),

          // Room type name
          Text(
            widget.roomType.name,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 12),

          // Booking details
          _buildSummaryRow(
            'Check-in',
            checkInDate != null
                ? DateFormat('dd/MM/yyyy').format(DateTime.parse(checkInDate))
                : 'Chưa chọn',
          ),
          _buildSummaryRow(
            'Check-out',
            checkOutDate != null
                ? DateFormat('dd/MM/yyyy').format(DateTime.parse(checkOutDate))
                : 'Chưa chọn',
          ),
          _buildSummaryRow('Số khách', '$guestCount người'),
          _buildSummaryRow('Số phòng', '$roomCount phòng'),

          if (checkInDate != null && checkOutDate != null) ...[
            _buildSummaryRow(
              'Số đêm',
              '${DateTime.parse(checkOutDate).difference(DateTime.parse(checkInDate)).inDays} đêm',
            ),
          ],

          Divider(height: 24, color: Colors.grey[300]),

          // Price breakdown
          if (widget.calculatedPrice != null) ...[
            _buildPriceRow(
              'Giá gốc',
              '${_formatPrice(widget.roomType.basePrice)} / đêm',
            ),
            if (widget.seasonalPricings != null &&
                widget.seasonalPricings!.isNotEmpty) ...[
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.local_fire_department, size: 16, color: Colors.orange[700]),
                        SizedBox(width: 4),
                        Text(
                          'Giá theo mùa (áp dụng cho thời gian đặt)',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.orange[700],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    ...widget.seasonalPricings!.map((pricing) {
                      final priceAfterSeason =
                          widget.roomType.basePrice * pricing.priceModifier;
                      return Padding(
                        padding: EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '• ${pricing.name}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ),
                            Text(
                              '${_formatPrice(priceAfterSeason)}/đêm',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Colors.orange[800],
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                ),
              ),
              SizedBox(height: 8),
            ],
            _buildPriceRow('Số phòng', 'x $roomCount'),
            if (checkInDate != null && checkOutDate != null) ...[
              _buildPriceRow(
                'Số đêm',
                'x ${DateTime.parse(checkOutDate).difference(DateTime.parse(checkInDate)).inDays}',
              ),
            ],
            Divider(height: 16, color: Colors.grey[300]),
            _buildPriceRow(
              'Tổng cộng',
              _formatPrice(widget.calculatedPrice!),
              isTotal: true,
            ),
          ] else ...[
            _buildPriceRow(
              'Giá phòng',
              '${_formatPrice(widget.roomType.basePrice)} / đêm',
              isTotal: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(
    String label,
    String value, {
    bool isTotal = false,
    bool isHighlight = false,
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              color: isTotal
                  ? Colors.black87
                  : (isHighlight ? Colors.orange : Colors.grey[600]),
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              color: isTotal
                  ? Colors.orange
                  : (isHighlight ? Colors.orange : Colors.black87),
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNightlyPricesBreakdown() {
    if (_nightlyPrices.isEmpty) {
      return SizedBox.shrink();
    }

    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today, color: Colors.teal, size: 24),
              SizedBox(width: 8),
              Text(
                'Chi tiết giá từng đêm',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          ..._nightlyPrices.asMap().entries.map((entry) {
            final index = entry.key;
            final price = entry.value;
            final nextDate = price.stayDate.add(Duration(days: 1));
            final isLastNight = index == _nightlyPrices.length - 1;
            
            return Container(
              margin: EdgeInsets.only(bottom: isLastNight ? 0 : 12),
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: price.hasSeasonalPricing 
                  ? Colors.orange.withOpacity(0.1)
                  : Colors.grey.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: price.hasSeasonalPricing
                    ? Colors.orange.withOpacity(0.3)
                    : Colors.grey.withOpacity(0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${price.formattedDate} → ${nextDate.day.toString().padLeft(2, '0')}/${nextDate.month.toString().padLeft(2, '0')}',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              price.weekdayName,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            _formatPrice(price.grossNightlyTotal),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: price.hasSeasonalPricing 
                                ? Colors.orange[700]
                                : Colors.black87,
                            ),
                          ),
                          if (price.quantity > 1) ...[
                            SizedBox(height: 2),
                            Text(
                              '${price.quantity} phòng x ${_formatPrice(price.grossNightlyPrice)}',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                  if (price.hasSeasonalPricing) ...[
                    SizedBox(height: 8),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.local_fire_department, size: 14, color: Colors.orange[800]),
                          SizedBox(width: 4),
                          Text(
                            'Giá mùa (x${price.seasonMultiplier.toStringAsFixed(2)})',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.orange[800],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
          if (_nightlyPrices.isNotEmpty) ...[
            Divider(height: 24, color: Colors.grey[300]),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tổng (${_nightlyPrices.length} đêm)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                Text(
                  _formatPrice(_nightlyPrices.fold(0.0, (sum, price) => sum + price.grossNightlyTotal)),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildUserInfoForm() {
    if (_user == null) {
      return Center(child: CircularProgressIndicator());
    }
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person, color: Colors.blue, size: 24),
              SizedBox(width: 8),
              Text(
                'Thông tin người đặt',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 20),
          _buildInfoRow('Username', _user!.username),
          _buildInfoRow('Email', _user!.email),
          _buildInfoRow('Số điện thoại', _user!.phoneNumber ?? ''),
          _buildInfoRow('Họ và tên', _user!.fullName ?? ''),
          _buildInfoRow('Địa chỉ', _user!.address ?? ''),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : '(Chưa cập nhật)',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialRequests() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.note_alt_outlined, color: Colors.green, size: 24),
              SizedBox(width: 8),
              Text(
                'Yêu cầu đặc biệt',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Text(
            'Hãy cho chúng tôi biết nếu bạn có yêu cầu đặc biệt nào',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
          SizedBox(height: 16),

          TextFormField(
            controller: _specialRequestsController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Ví dụ: Phòng tầng cao, giường đôi, không hút thuốc...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              alignLabelWithHint: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTermsAndConditions() {
    final hotel = widget.hotel;
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Điều khoản và điều kiện',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: 16),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPolicyItem(
                  '• Check-in sau ${hotel.checkInTime ?? "14:00"}',
                ),
                _buildPolicyItem(
                  '• Check-out trước ${hotel.checkOutTime ?? "12:00"}',
                ),
                _buildPolicyItem('• Không cho phép thú cưng'),
                _buildPolicyItem('• Không hút thuốc trong phòng'),
              ],
            ),
          ),
          SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: _agreeToTerms,
                onChanged: (value) {
                  setState(() {
                    _agreeToTerms = value ?? false;
                  });
                },
                activeColor: Colors.orange,
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _agreeToTerms = !_agreeToTerms;
                    });
                  },
                  child: Text(
                    'Tôi đồng ý với điều khoản và điều kiện của khách sạn',
                    style: TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyItem(String text) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 2),
      child: Text(
        text,
        style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.4),
      ),
    );
  }

  Widget _buildBottomBookingBar() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tổng tiền',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
                Text(
                  widget.calculatedPrice != null
                      ? _formatPrice(widget.calculatedPrice!)
                      : _formatPrice(widget.roomType.basePrice),
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 20),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleBookingConfirmation,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
              ),
              child: _isLoading
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      'Xác nhận đặt phòng',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleBookingConfirmation() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng điền đầy đủ thông tin bắt buộc'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng đồng ý với điều khoản và điều kiện'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final checkInDate = widget.searchParams?['checkInDate'];
      final checkOutDate = widget.searchParams?['checkOutDate'];
      final guestCount = widget.searchParams?['guestCount'] ?? 1;
      final hotelId = widget.hotel.hotelId;
      final userId = _user?.userId;
      final roomTypeId = widget.roomType.roomTypeId;
      final roomCount = widget.calculatedRoom?['requiredRooms'] ?? 1;
      final unitPrice = widget.calculatedPrice ?? widget.roomType.basePrice;
      final subtotal = unitPrice;

      if (checkInDate == null ||
          checkOutDate == null ||
          userId == null ||
          roomTypeId == null) {
        throw Exception('Thiếu thông tin đặt phòng cần thiết');
      }

      final totalPrice = widget.calculatedPrice ?? widget.roomType.basePrice;

      // 1. Tạo booking master
      final result = await BookingService().createBooking(
        userId: userId,
        hotelId: hotelId,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        totalGuests: guestCount,
        totalPrice: totalPrice,
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: _selectedPaymentMethod,
        promotionId: null,
        specialRequests: _specialRequestsController.text.trim().isNotEmpty
            ? _specialRequestsController.text.trim()
            : null,
      );

      if (result['success']) {
        // Sửa đoạn này để lấy bookingId đúng
        final bookingId = result['data']?['booking']?['bookingId'];
        if (bookingId == null) {
          throw Exception('Không lấy được mã đặt phòng');
        }

        // 3. Tạo booking_detail
        final bookingDetailData = {
          "room_details": [
            {
              "room_type_id": roomTypeId,
              "quantity": roomCount,
              "unit_price": (unitPrice / roomCount),
              "subtotal": subtotal,
              "guests_per_room": (guestCount / roomCount).round(),
            },
          ],
        };

        final detailResult = await BookingService().addBookingDetails(
          bookingId: bookingId,
          bookingDetailData: bookingDetailData,
        );

        if (detailResult['success']) {
          // 4. Lưu booking_nightly_prices
          await _saveNightlyPrices(bookingId, roomTypeId, roomCount);

          _showSuccessDialog(bookingId);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                detailResult['message'] ?? 'Lỗi khi thêm chi tiết đặt phòng',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Lỗi khi đặt phòng'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  /// Lưu giá từng đêm vào database
  Future<void> _saveNightlyPrices(String bookingId, String roomTypeId, int roomCount) async {
    try {
      final checkInDate = widget.searchParams?['checkInDate'];
      final checkOutDate = widget.searchParams?['checkOutDate'];

      if (checkInDate == null || checkOutDate == null) return;

      final checkIn = DateTime.parse(checkInDate);
      final checkOut = DateTime.parse(checkOutDate);
      final nights = checkOut.difference(checkIn).inDays;

      print('🌙 Saving $nights nightly prices for booking: $bookingId');

      for (int i = 0; i < nights; i++) {
        final stayDate = checkIn.add(Duration(days: i));
        final baseRate = widget.roomType.basePrice;
        
        // Tìm seasonal pricing áp dụng cho ngày này
        SeasonalPricing? applicableSeason;
        if (widget.seasonalPricings != null) {
          for (var season in widget.seasonalPricings!) {
            if (season.isDateInRange(stayDate)) {
              applicableSeason = season;
              break;
            }
          }
        }

        final seasonMultiplier = applicableSeason?.priceModifier ?? 1.0;

        // Gọi API để lưu
        final nightlyPriceData = {
          'booking_id': bookingId,
          'room_type_id': roomTypeId,
          'stay_date': stayDate.toIso8601String().split('T')[0],
          'quantity': roomCount,
          'base_rate': baseRate,
          'season_pricing_id': applicableSeason?.pricingId,
          'season_multiplier': seasonMultiplier,
        };

        print('📤 Sending nightly price data for ${stayDate.toIso8601String().split('T')[0]}: $nightlyPriceData');

        final result = await BookingNightlyPriceService().create(nightlyPriceData);
        
        if (result['success']) {
          print('✅ Nightly price saved for ${stayDate.toIso8601String().split('T')[0]}');
        } else {
          print('❌ Failed to save nightly price: ${result['message']}');
        }
      }
      
      print('✅ All nightly prices saved successfully');
    } catch (e) {
      print('❌ Error saving nightly prices: $e');
      // Không throw error để không block việc booking thành công
    }
  }

  void _showSuccessDialog(String bookingId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: Icon(Icons.check_circle, color: Colors.green, size: 64),
        title: Text(
          'Đặt phòng thành công!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Mã đặt phòng của bạn:',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            SizedBox(height: 8),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                bookingId,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ),
            SizedBox(height: 16),
            Text(
              'Chúng tôi đã gửi email xác nhận đến địa chỉ ${_emailController.text}',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(); // Back to room detail
              Navigator.of(context).pop(); // Back to booking screen
              Navigator.of(context).pop(); // Back to hotel detail (if needed)
            },
            child: Text(
              'Hoàn tất',
              style: TextStyle(
                color: Colors.orange,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} VNĐ';
  }
}
