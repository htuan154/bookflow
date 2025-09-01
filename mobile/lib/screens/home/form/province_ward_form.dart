import 'package:flutter/material.dart';
import '../../../services/vietnam_province_service.dart';
import '../../../services/hotel_service.dart';
import '../search/search_results_screen.dart';
import '../../../classes/roomtypeavailability_model.dart';
import '../../../classes/hotel_model.dart'; // Thêm import này

// Widget chọn tỉnh/phường giống main.dart demo
class ProvinceWardForm extends StatefulWidget {
  final VoidCallback? onLoadCompleted; // Thêm callback
  const ProvinceWardForm({Key? key, this.onLoadCompleted}) : super(key: key);

  @override
  State<ProvinceWardForm> createState() => _ProvinceWardFormState();
}

class _ProvinceWardFormState extends State<ProvinceWardForm> {
  final VietnamProvinceService _service = VietnamProvinceService();
  final HotelService _hotelService = HotelService();
  List<Province> _allProvinces = [];
  List<Province> _filteredProvinces = [];
  List<Ward> _allWards = [];
  List<Ward> _filteredWards = [];
  Province? _selectedProvince;
  Ward? _selectedWard;
  final TextEditingController _provinceSearchController = TextEditingController();
  final TextEditingController _wardSearchController = TextEditingController();
  bool _isLoading = true;
  bool _isSearching = false;

  // Thêm các biến cho date và số lượng
  DateTime? _checkInDate;
  DateTime? _checkOutDate;
  int _guestCount = 1;
  int _roomCount = 1;

  @override
  void initState() {
    super.initState();
    _initializeDates();
    _loadData();
  }

  void _initializeDates() {
    final today = DateTime.now();
    // Ngày nhận phòng mặc định: hôm nay + 1 ngày
    _checkInDate = DateTime(today.year, today.month, today.day).add(Duration(days: 1));
    // Ngày trả phòng mặc định: hôm nay + 2 ngày  
    _checkOutDate = DateTime(today.year, today.month, today.day).add(Duration(days: 2));
  }

  Future<void> _loadData() async {
    try {
      final provinces = await _service.fetchProvinces();
      setState(() {
        _allProvinces = provinces;
        _filteredProvinces = provinces;
        _isLoading = false;
      });

      // Gọi callback báo HomeScreen là đã load xong
      widget.onLoadCompleted?.call();
    } catch (e) {
      debugPrint('Error: $e');
      setState(() {
        _isLoading = false;
      });

      // Vẫn gọi callback dù có lỗi
      widget.onLoadCompleted?.call();
    }
  }

  void _filterProvinces(String keyword) {
    setState(() {
      _filteredProvinces = _service.searchProvinces(keyword, _allProvinces);
      if (_selectedProvince != null &&
          !_filteredProvinces.contains(_selectedProvince)) {
        _selectedProvince = null;
        _selectedWard = null;
        _allWards = [];
        _filteredWards = [];
        _wardSearchController.clear();
      }
    });
  }

  void _filterWards(String keyword) {
    setState(() {
      _filteredWards = _service.searchWards(keyword, _allWards);
      if (_selectedWard != null && !_filteredWards.contains(_selectedWard)) {
        _selectedWard = null;
      }
    });
  }

  void _onProvinceSelected(Province? province) {
    setState(() {
      _selectedProvince = province;
      _selectedWard = null;
      _allWards = province != null
          ? _service.getWardsByProvince(province.name, _allProvinces)
          : [];
      _filteredWards = _allWards;
      _wardSearchController.clear();
    });
  }

  Future<void> _selectDate(bool isCheckIn) async {
    final DateTime initialDate = isCheckIn 
        ? (_checkInDate ?? DateTime.now().add(Duration(days: 1)))
        : (_checkOutDate ?? DateTime.now().add(Duration(days: 2)));
    
    // firstDate cho phép xem từ xa trong quá khứ
    final DateTime firstDateForDisplay = DateTime.now().subtract(Duration(days: 365));
    
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDateForDisplay, // Cho phép xem các ngày trước
      lastDate: DateTime.now().add(Duration(days: 365)),
      selectableDayPredicate: (DateTime date) {
        // Logic để disable các ngày không được chọn
        final today = DateTime.now();
        final todayOnly = DateTime(today.year, today.month, today.day);
        final dateOnly = DateTime(date.year, date.month, date.day);
        
        if (isCheckIn) {
          // Ngày nhận phòng: chỉ cho chọn từ ngày mai trở đi
          return dateOnly.isAfter(todayOnly);
        } else {
          // Ngày trả phòng: phải sau ngày nhận phòng
          if (_checkInDate != null) {
            final checkInOnly = DateTime(_checkInDate!.year, _checkInDate!.month, _checkInDate!.day);
            return dateOnly.isAfter(checkInOnly);
          }
          // Nếu chưa có ngày nhận phòng, ít nhất phải từ ngày mai + 1
          return dateOnly.isAfter(todayOnly.add(Duration(days: 1)));
        }
      },
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.orange,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
            textTheme: Theme.of(context).textTheme.copyWith(
              // Style cho ngày bị disable
              bodySmall: TextStyle(color: Colors.grey[400]),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isCheckIn) {
          _checkInDate = picked;
          // Nếu ngày nhận phòng >= ngày trả phòng, tự động điều chỉnh ngày trả phòng
          if (_checkOutDate != null && 
              (picked.isAtSameMomentAs(_checkOutDate!) || picked.isAfter(_checkOutDate!))) {
            _checkOutDate = picked.add(Duration(days: 1));
          }
        } else {
          _checkOutDate = picked;
        }
      });
    }
  }

  void _incrementGuest() {
    if (_guestCount < 10) {
      setState(() {
        _guestCount++;
      });
    }
  }

  void _decrementGuest() {
    // Số khách không được ít hơn số phòng
    if (_guestCount > 1 && _guestCount > _roomCount) {
      setState(() {
        _guestCount--;
      });
    }
  }

  void _incrementRoom() {
    if (_roomCount < 5) {
      setState(() {
        _roomCount++;
        // Nếu số phòng lớn hơn số khách, tự động tăng số khách
        if (_roomCount > _guestCount) {
          _guestCount = _roomCount;
        }
      });
    }
  }

  void _decrementRoom() {
    if (_roomCount > 1) {
      setState(() {
        _roomCount--;
      });
    }
  }

  Future<void> _performSearch() async {
    // Kiểm tra có chọn tỉnh/thành không
    if (_selectedProvince == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng chọn tỉnh/thành phố'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Kiểm tra ngày
    if (_checkInDate == null || _checkOutDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng chọn ngày nhận và trả phòng'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isSearching = true;
    });

    try {
      // Gọi API search availability
      final result = await _hotelService.searchAvailableRooms(
        city: _selectedProvince!.name,
        checkInDate: _checkInDate!.toIso8601String().split('T')[0], // Format: YYYY-MM-DD
        checkOutDate: _checkOutDate!.toIso8601String().split('T')[0],
        ward: _selectedWard?.name, // Optional
      );

      // Print kết quả từ server (raw)
      print('=== RAW SEARCH RESULT ===');
      print('Success: ${result['success']}');
      print('Message: ${result['message']}');
      print('Data count: ${result['data']?.length ?? 0}');
      print('========================');

      if (result['success'] == true) {
        // Parse data thành list RoomTypeAvailability
        List<RoomTypeAvailability> allAvailabilities = [];
        
        if (result['data'] != null && result['data'] is List) {
          for (var item in result['data']) {
            try {
              final availability = RoomTypeAvailability.fromJson(item);
              allAvailabilities.add(availability);
            } catch (e) {
              print('Error parsing item: $item, Error: $e');
            }
          }
        }

        print('=== FILTERING BY GUEST CAPACITY AND ROOM COUNT ===');
        print('User requested: $_guestCount guests, $_roomCount rooms');
        print('Total rooms found: ${allAvailabilities.length}');
        print('');

        // Lọc các phòng đủ sức chứa số khách và số phòng
        List<RoomTypeAvailability> suitableRooms = [];

        for (var room in allAvailabilities) {
          print('Checking room: ${room.roomTypeName}');
          print('  - Available rooms: ${room.availableRooms}');
          print('  - Max occupancy per room: ${room.maxOccupancy ?? "N/A"}');
          print('  - User requested rooms: $_roomCount');
          
          // Tính tổng sức chứa = số phòng available * maxOccupancy per room
          int totalCapacity = 0;
          if (room.maxOccupancy != null && room.maxOccupancy! > 0) {
            totalCapacity = room.availableRooms * room.maxOccupancy!;
          }
          
          print('  - Total capacity: $totalCapacity guests');
          
          // Kiểm tra 2 điều kiện:
          // 1. Đủ sức chứa khách: totalCapacity >= _guestCount
          // 2. Đủ số phòng: availableRooms >= _roomCount
          bool hasEnoughCapacity = totalCapacity >= _guestCount;
          bool hasEnoughRooms = room.availableRooms >= _roomCount;
          
          print('  - DEBUG: hasEnoughCapacity = $hasEnoughCapacity ($totalCapacity >= $_guestCount)');
          print('  - DEBUG: hasEnoughRooms = $hasEnoughRooms (${room.availableRooms} >= $_roomCount)');
          print('  - DEBUG: Both conditions = ${hasEnoughCapacity && hasEnoughRooms}');
          
          if (hasEnoughCapacity && hasEnoughRooms) {
            suitableRooms.add(room);
            print('  ✓ SUITABLE - Added to results');
            print('    ✓ Capacity check passed ($totalCapacity >= $_guestCount)');
            print('    ✓ Room count check passed (${room.availableRooms} >= $_roomCount)');
          } else {
            print('  ✗ NOT SUITABLE - Failed checks:');
            if (!hasEnoughCapacity) {
              print('    ✗ Not enough capacity ($totalCapacity < $_guestCount)');
            }
            if (!hasEnoughRooms) {
              print('    ✗ Not enough rooms (${room.availableRooms} < $_roomCount)');
            }
          }
          print('');
        }

        print('=== FINAL FILTERED RESULTS ===');
        print('Suitable rooms: ${suitableRooms.length}');
        
        // Lấy danh sách hotel ID không trùng lặp
        Set<String> uniqueHotelIds = {};
        for (var room in suitableRooms) {
          if (room.hotelId != null) {
            uniqueHotelIds.add(room.hotelId!);
          }
        }

        print('Unique hotel IDs: ${uniqueHotelIds.length}');
        print('Hotel IDs: $uniqueHotelIds');
        print('===============================');

        if (suitableRooms.isNotEmpty) {
          // Lấy thông tin chi tiết các khách sạn
          List<Hotel> hotels = [];
          
          for (String hotelId in uniqueHotelIds) {
            try {
              final hotelResult = await _hotelService.getHotelById(hotelId);
              if (hotelResult['success'] == true && hotelResult['data'] != null) {
                hotels.add(hotelResult['data']);
                print('✓ Loaded hotel: ${hotelResult['data'].name}');
              } else {
                print('✗ Failed to load hotel ID: $hotelId');
              }
            } catch (e) {
              print('✗ Error loading hotel ID $hotelId: $e');
            }
          }

          print('=== LOADED HOTELS ===');
          print('Successfully loaded: ${hotels.length} hotels');
          for (var hotel in hotels) {
            print('- ${hotel.name} (${hotel.hotelId})'); // Sửa từ hotel.id thành hotel.hotelId
          }
          print('====================');

          // Hiển thị thông báo thành công
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Tìm thấy ${hotels.length} khách sạn có phòng phù hợp'),
              backgroundColor: Colors.green,
            ),
          );

          // Navigate tới SearchResultsScreen - truyền cả hotels và suitable rooms
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SearchResultsScreen(
                hotels: hotels,
                searchType: 'availability',
                city: _selectedProvince?.name,
                ward: _selectedWard?.name,
                pagination: null,
                suitableRooms: suitableRooms,
                searchParams: {
                  'checkInDate': _checkInDate!.toIso8601String().split('T')[0],
                  'checkOutDate': _checkOutDate!.toIso8601String().split('T')[0],
                  'guestCount': _guestCount,
                  'roomCount': _roomCount,
                  'checkInDateFormatted': '${_checkInDate!.day.toString().padLeft(2, '0')}/${_checkInDate!.month.toString().padLeft(2, '0')}/${_checkInDate!.year}',
                  'checkOutDateFormatted': '${_checkOutDate!.day.toString().padLeft(2, '0')}/${_checkOutDate!.month.toString().padLeft(2, '0')}/${_checkOutDate!.year}',
                },
              ),
            ),
          );
        } else {
          // Hiển thị thông báo không tìm thấy
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Không tìm thấy loại phòng nào đủ chỗ cho $_guestCount khách, $_roomCount phòng'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } else {
        // Hiển thị lỗi
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Lỗi khi tìm kiếm phòng trống'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('=== SEARCH ERROR ===');
      print('Exception: $e');
      print('====================');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  Widget _buildDateSelector(String label, DateTime? selectedDate, bool isCheckIn) {
    return InkWell(
      onTap: () => _selectDate(isCheckIn),
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: Colors.orange),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    selectedDate != null
                        ? '${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.year}'
                        : 'Chọn ngày',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: selectedDate != null ? Colors.black87 : Colors.grey[500],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCounter(String label, int value, VoidCallback? onIncrement, VoidCallback? onDecrement, IconData icon) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 8),
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.orange),
              SizedBox(width: 4),
              Expanded(
                child: Text(
                  '$value',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: onDecrement,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: EdgeInsets.all(6),
                        child: Icon(
                          Icons.remove,
                          size: 14,
                          color: onDecrement != null ? Colors.orange : Colors.grey[400],
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: onIncrement,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: EdgeInsets.all(6),
                        child: Icon(
                          Icons.add,
                          size: 14,
                          color: onIncrement != null ? Colors.orange : Colors.grey[400],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Province search
          TextField(
            controller: _provinceSearchController,
            decoration: const InputDecoration(
              labelText: 'Tìm kiếm tỉnh/thành',
              border: OutlineInputBorder(),
              fillColor: Colors.white,
              filled: true,
            ),
            onChanged: _filterProvinces,
          ),
          SizedBox(height: 10),
          
          // Province dropdown
          DropdownButtonFormField<Province>(
            value: _selectedProvince,
            items: _filteredProvinces
                .map((p) => DropdownMenuItem(value: p, child: Text(p.name)))
                .toList(),
            onChanged: _onProvinceSelected,
            decoration: const InputDecoration(
              labelText: 'Chọn tỉnh/thành',
              border: OutlineInputBorder(),
              fillColor: Colors.white,
              filled: true,
            ),
          ),
          SizedBox(height: 16),
          
          // Ward search
          TextField(
            controller: _wardSearchController,
            decoration: const InputDecoration(
              labelText: 'Tìm kiếm phường/xã',
              border: OutlineInputBorder(),
              fillColor: Colors.white,
              filled: true,
            ),
            onChanged: _filterWards,
          ),
          SizedBox(height: 10),
          
          // Ward dropdown
          DropdownButtonFormField<Ward>(
            value: _selectedWard,
            items: _filteredWards
                .map((w) => DropdownMenuItem(value: w, child: Text(w.name)))
                .toList(),
            onChanged: (ward) {
              setState(() {
                _selectedWard = ward;
              });
            },
            decoration: const InputDecoration(
              labelText: 'Chọn phường/xã',
              border: OutlineInputBorder(),
              fillColor: Colors.white,
              filled: true,
            ),
          ),
          SizedBox(height: 16),

          // Date selectors
          Row(
            children: [
              Expanded(child: _buildDateSelector('Ngày nhận phòng', _checkInDate, true)),
              SizedBox(width: 12),
              Expanded(child: _buildDateSelector('Ngày trả phòng', _checkOutDate, false)),
            ],
          ),
          SizedBox(height: 16),

          // Guest and Room counters
          Row(
            children: [
              Expanded(child: _buildCounter(
                'Số khách', 
                _guestCount, 
                _guestCount < 10 ? _incrementGuest : null, 
                (_guestCount > 1 && _guestCount > _roomCount) ? _decrementGuest : null,
                Icons.people
              )),
              SizedBox(width: 12),
              Expanded(child: _buildCounter(
                'Số phòng', 
                _roomCount, 
                _roomCount < 5 ? _incrementRoom : null, 
                _roomCount > 1 ? _decrementRoom : null,
                Icons.hotel
              )),
            ],
          ),

          // Info hint nếu guest = room
          if (_guestCount <= _roomCount)
            Container(
              margin: EdgeInsets.only(top: 8),
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Icon(Icons.info, size: 14, color: Colors.orange),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Số khách phải ít nhất bằng số phòng',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.orange[700],
                      ),
                    ),
                  ),
                ],
              ),
            ),

          SizedBox(height: 16),

          // Search button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isSearching ? null : _performSearch,
              icon: _isSearching
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(Icons.search),
              label: Text(_isSearching ? 'Đang tìm...' : 'Tìm kiếm'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
                textStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
