import 'package:flutter/material.dart';
import '../../../services/vietnam_province_service.dart';

// Widget chọn tỉnh/phường giống main.dart demo
class ProvinceWardForm extends StatefulWidget {
  const ProvinceWardForm({Key? key}) : super(key: key);

  @override
  State<ProvinceWardForm> createState() => _ProvinceWardFormState();
}

class _ProvinceWardFormState extends State<ProvinceWardForm> {
  final VietnamProvinceService _service = VietnamProvinceService();
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
    } catch (e) {
      debugPrint('Error: $e');
      setState(() {
        _isLoading = false;
      });
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
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
              onPressed: () {
                _filterProvinces(_provinceSearchController.text);
                _filterWards(_wardSearchController.text);
              },
              icon: Icon(Icons.search),
              label: Text('Tìm kiếm'),
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