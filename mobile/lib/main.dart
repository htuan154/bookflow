import 'package:flutter/material.dart';

// Import các file screen của bạn
import 'package:client_khachhang/screens/welcome_screens/welcome.dart'; // Đường dẫn đến file WelcomeScreen
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BookFlow',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepOrange),
        useMaterial3: true,
      ),
      home: const WelcomeScreen(), // Thay đổi từ MyHomePage thành WelcomeScreen
      debugShowCheckedModeBanner: false, // Tùy chọn: ẩn banner debug
    );
  }
}

// lib/main.dart
// import 'package:flutter/material.dart';
// import 'screens/home/home_screen.dart';

// void main() {
//   runApp(MyApp());
// }

// class MyApp extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'Hotel Booking App',
//       debugShowCheckedModeBanner: false,
//       theme: ThemeData(
//         primarySwatch: Colors.orange,
//         scaffoldBackgroundColor: Colors.white,
//         fontFamily: 'Roboto',
//       ),
//       home: HomeScreen(),
//     );
//   }
// }


// // Test api vietnam_province_service.dart
// import 'package:flutter/material.dart';
// import '../services/vietnam_province_service.dart'; // file service bạn đưa

// void main() {
//   runApp(const MyApp());
// }

// class MyApp extends StatelessWidget {
//   const MyApp({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'Tỉnh & Phường',
//       theme: ThemeData(primarySwatch: Colors.blue),
//       home: const ProvinceWardScreen(),
//     );
//   }
// }

// class ProvinceWardScreen extends StatefulWidget {
//   const ProvinceWardScreen({super.key});

//   @override
//   State<ProvinceWardScreen> createState() => _ProvinceWardScreenState();
// }

// class _ProvinceWardScreenState extends State<ProvinceWardScreen> {
//   final VietnamProvinceService _service = VietnamProvinceService();

//   List<Province> _allProvinces = [];
//   List<Province> _filteredProvinces = [];
//   List<Ward> _allWards = [];
//   List<Ward> _filteredWards = [];

//   Province? _selectedProvince;
//   Ward? _selectedWard;

//   final TextEditingController _provinceSearchController =
//       TextEditingController();
//   final TextEditingController _wardSearchController = TextEditingController();

//   bool _isLoading = true;

//   @override
//   void initState() {
//     super.initState();
//     _loadData();
//   }

//   Future<void> _loadData() async {
//     try {
//       final provinces = await _service.fetchProvinces();
//       setState(() {
//         _allProvinces = provinces;
//         _filteredProvinces = provinces;
//         _isLoading = false;
//       });
//     } catch (e) {
//       debugPrint('Error: $e');
//       setState(() {
//         _isLoading = false;
//       });
//     }
//   }

//   void _filterProvinces(String keyword) {
//     setState(() {
//       _filteredProvinces = _service.searchProvinces(keyword, _allProvinces);
//       // Nếu _selectedProvince không còn trong _filteredProvinces thì reset về null và reset luôn ward
//       if (_selectedProvince != null &&
//           !_filteredProvinces.contains(_selectedProvince)) {
//         _selectedProvince = null;
//         _selectedWard = null;
//         _allWards = [];
//         _filteredWards = [];
//         _wardSearchController.clear();
//       }
//     });
//   }

//   void _filterWards(String keyword) {
//     setState(() {
//       _filteredWards = _service.searchWards(keyword, _allWards);
//       // Nếu _selectedWard không còn trong _filteredWards thì reset về null
//       if (_selectedWard != null && !_filteredWards.contains(_selectedWard)) {
//         _selectedWard = null;
//       }
//     });
//   }

//   void _onProvinceSelected(Province? province) {
//     setState(() {
//       _selectedProvince = province;
//       _selectedWard = null;
//       _allWards = province != null
//           ? _service.getWardsByProvince(province.name, _allProvinces)
//           : [];
//       _filteredWards = _allWards;
//       _wardSearchController.clear();
//     });
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(title: const Text('Chọn Tỉnh/Phường')),
//       body: _isLoading
//           ? const Center(child: CircularProgressIndicator())
//           : Padding(
//               padding: const EdgeInsets.all(16),
//               child: Column(
//                 children: [
//                   // Search Province
//                   TextField(
//                     controller: _provinceSearchController,
//                     decoration: const InputDecoration(
//                       labelText: 'Tìm kiếm tỉnh/thành',
//                       border: OutlineInputBorder(),
//                     ),
//                     onChanged: _filterProvinces,
//                   ),
//                   const SizedBox(height: 10),

//                   // Province Dropdown
//                   DropdownButtonFormField<Province>(
//                     value: _selectedProvince,
//                     items: _filteredProvinces
//                         .map(
//                           (p) =>
//                               DropdownMenuItem(value: p, child: Text(p.name)),
//                         )
//                         .toList(),
//                     onChanged: _onProvinceSelected,
//                     decoration: const InputDecoration(
//                       labelText: 'Chọn tỉnh/thành',
//                       border: OutlineInputBorder(),
//                     ),
//                   ),
//                   const SizedBox(height: 20),

//                   // Search Ward
//                   TextField(
//                     controller: _wardSearchController,
//                     decoration: const InputDecoration(
//                       labelText: 'Tìm kiếm phường/xã',
//                       border: OutlineInputBorder(),
//                     ),
//                     onChanged: _filterWards,
//                   ),
//                   const SizedBox(height: 10),

//                   // Ward Dropdown
//                   DropdownButtonFormField<Ward>(
//                     value: _selectedWard,
//                     items: _filteredWards
//                         .map(
//                           (w) =>
//                               DropdownMenuItem(value: w, child: Text(w.name)),
//                         )
//                         .toList(),
//                     onChanged: (ward) {
//                       setState(() {
//                         _selectedWard = ward;
//                       });
//                     },
//                     decoration: const InputDecoration(
//                       labelText: 'Chọn phường/xã',
//                       border: OutlineInputBorder(),
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//     );
//   }
// }

// import 'package:flutter/material.dart';

// void main() {
//   runApp(MyApp());
// }

// class MyApp extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       debugShowCheckedModeBanner: false, // Ẩn banner debug
//       home: Scaffold(
//         appBar: AppBar(
//           title: Text('Load ảnh từ mạng'),
//           centerTitle: true,
//         ),
//         body: Center(
//           child: Image.network(
//             'https://pngimg.com/d/price_label_PNG50.png',
//             loadingBuilder: (context, child, loadingProgress) {
//               if (loadingProgress == null) return child; // Đã load xong
//               return CircularProgressIndicator(); // Đang load
//             },
//             errorBuilder: (context, error, stackTrace) {
//               return Text('Không tải được ảnh 😢');
//             },
//           ),
//         ),
//       ),
//     );
//   }
// }
