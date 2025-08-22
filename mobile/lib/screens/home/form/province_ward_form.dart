import 'package:flutter/material.dart';
import '../../../services/vietnam_province_service.dart';
import '../../../services/hotel_service.dart';
import '../search/search_results_screen.dart';

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
  final TextEditingController _provinceSearchController =
      TextEditingController();
  final TextEditingController _wardSearchController = TextEditingController();
  bool _isLoading = true;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _loadData();
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

    setState(() {
      _isSearching = true;
    });

    try {
      Map<String, dynamic> result;
      String searchType;

      // Nếu có cả tỉnh và phường thì gọi searchHotelsByLocation
      if (_selectedWard != null) {
        result = await _hotelService.searchHotelsByLocation(
          city: _selectedProvince!.name,
          ward: _selectedWard!.name,
        );
        searchType = 'location';
      } else {
        // Chỉ có tỉnh thì gọi searchHotels
        result = await _hotelService.searchHotels(
          city: _selectedProvince!.name,
        );
        searchType = 'city';
      }

      if (result['success'] == true) {
        // Navigate to search results screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => SearchResultsScreen(
              hotels: result['data'] ?? [],
              searchType: searchType,
              city: _selectedProvince?.name,
              ward: _selectedWard?.name,
              pagination: result['pagination'],
            ),
          ),
        );
      } else {
        // Hiển thị lỗi
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Lỗi khi tìm kiếm'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Không hiển thị loading riêng nữa, để HomeScreen quản lý
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
          SizedBox(height: 20),
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
          SizedBox(height: 20),
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
