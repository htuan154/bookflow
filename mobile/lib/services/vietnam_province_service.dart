// import 'dart:convert';
// import 'package:http/http.dart' as http;

// class Province {
//   final int code;
//   final String name;
//   final String nameWithoutDiacritics;

//   Province({
//     required this.code,
//     required this.name,
//     required this.nameWithoutDiacritics,
//   });

//   factory Province.fromJson(Map<String, dynamic> json) {
//     final name = json['name'] ?? '';
//     return Province(
//       code: json['code'] ?? 0,
//       name: name,
//       nameWithoutDiacritics:
//           Province.removeVietnameseDiacritics(name).toLowerCase(),
//     );
//   }

//   /// Hàm bỏ dấu tiếng Việt
//   static String removeVietnameseDiacritics(String str) {
//     const vietnamese = 'àáạảãâầấậẩẫăằắặẳẵ'
//         'èéẹẻẽêềếệểễ'
//         'ìíịỉĩ'
//         'òóọỏõôồốộổỗơờớợởỡ'
//         'ùúụủũưừứựửữ'
//         'ỳýỵỷỹ'
//         'đ'
//         'ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ'
//         'ÈÉẸẺẼÊỀẾỆỂỄ'
//         'ÌÍỊỈĨ'
//         'ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ'
//         'ÙÚỤỦŨƯỪỨỰỬỮ'
//         'ỲÝỴỶỸ'
//         'Đ';
//     const without = 'aaaaaaaaaaaaaaaaa'
//         'eeeeeeeeeee'
//         'iiiii'
//         'ooooooooooooooooo'
//         'uuuuuuuuuuu'
//         'yyyyy'
//         'd'
//         'AAAAAAAAAAAAAAAAA'
//         'EEEEEEEEEEE'
//         'IIIII'
//         'OOOOOOOOOOOOOOOOO'
//         'UUUUUUUUUUU'
//         'YYYYY'
//         'D';

//     for (int i = 0; i < vietnamese.length; i++) {
//       str = str.replaceAll(vietnamese[i], without[i]);
//     }
//     return str;
//   }
// }

// class ProvinceService {
//   static const String _baseUrl = "https://provinces.open-api.vn/api/p/";

//   /// Lấy danh sách tỉnh và sắp xếp A-Z (bỏ dấu để so sánh)
//   Future<List<Province>> fetchProvinces() async {
//     final response = await http.get(Uri.parse(_baseUrl));
//     if (response.statusCode == 200) {
//       List data = jsonDecode(response.body);
//       List<Province> provinces =
//           data.map((item) => Province.fromJson(item)).toList();

//       provinces.sort((a, b) =>
//           a.nameWithoutDiacritics.compareTo(b.nameWithoutDiacritics));

//       return provinces;
//     } else {
//       throw Exception("Failed to load provinces");
//     }
//   }

//   /// Tìm 1 tỉnh (bỏ dấu để tìm)
//   Future<Province?> searchProvinceByName(String keyword) async {
//     final provinces = await fetchProvinces();
//     final keywordNormalized =
//         Province.removeVietnameseDiacritics(keyword).toLowerCase();
//     return provinces.firstWhere(
//       (p) => p.nameWithoutDiacritics.contains(keywordNormalized),
//       orElse: () => Province(code: 0, name: '', nameWithoutDiacritics: ''),
//     );
//   }

//   /// Lọc nhiều tỉnh (bỏ dấu để lọc) + sắp xếp A-Z
//   Future<List<Province>> searchProvinces(String keyword) async {
//     final provinces = await fetchProvinces();
//     final keywordNormalized =
//         Province.removeVietnameseDiacritics(keyword).toLowerCase();
//     List<Province> result = provinces
//         .where((p) => p.nameWithoutDiacritics.contains(keywordNormalized))
//         .toList();

//     result.sort((a, b) =>
//         a.nameWithoutDiacritics.compareTo(b.nameWithoutDiacritics));

//     return result;
//   }
// }

import 'dart:convert';
import 'package:http/http.dart' as http;

class Province {
  final String id;
  final String name;
  final String nameWithoutDiacritics;
  final List<Ward> wards;

  Province({
    required this.id,
    required this.name,
    required this.nameWithoutDiacritics,
    required this.wards,
  });

  factory Province.fromJson(Map<String, dynamic> json) {
    final name = json['province'] ?? '';
    final id = json['id']?.toString() ?? '';
    final wards = (json['wards'] as List<dynamic>? ?? [])
        .map((item) => Ward.fromJson(item))
        .toList();
    wards.sort(
      (a, b) => removeVietnameseDiacritics(a.name).toLowerCase().compareTo(
        removeVietnameseDiacritics(b.name).toLowerCase(),
      ),
    );
    return Province(
      id: id,
      name: name,
      nameWithoutDiacritics: removeVietnameseDiacritics(name).toLowerCase(),
      wards: wards,
    );
  }

  static String removeVietnameseDiacritics(String str) {
    // Chuẩn hóa Unicode về dạng NFC để xử lý ký tự tổ hợp
    // Sử dụng package 'characters' của Dart
    // Nếu không có, dùng RegExp để loại bỏ dấu tổ hợp
    // Đầu tiên, loại bỏ các dấu tổ hợp Unicode
    str = str.replaceAll(RegExp(r'[\u0300-\u036f]'), '');

    const vietnamese =
        'àáạảãâầấậẩẫăằắặẳẵ'
        'èéẹẻẽêềếệểễ'
        'ìíịỉĩ'
        'òóọỏõôồốộổỗơờớợởỡ'
        'ùúụủũưừứựửữ'
        'ỳýỵỷỹ'
        'đ'
        'ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ'
        'ÈÉẸẺẼÊỀẾỆỂỄ'
        'ÌÍỊỈĨ'
        'ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ'
        'ÙÚỤỦŨƯỪỨỰỬỮ'
        'ỲÝỴỶỸ'
        'Đ';
    const without =
        'aaaaaaaaaaaaaaaaa'
        'eeeeeeeeeee'
        'iiiii'
        'ooooooooooooooooo'
        'uuuuuuuuuuu'
        'yyyyy'
        'd'
        'AAAAAAAAAAAAAAAAA'
        'EEEEEEEEEEE'
        'IIIII'
        'OOOOOOOOOOOOOOOOO'
        'UUUUUUUUUUU'
        'YYYYY'
        'D';

    String result = str;
    for (int i = 0; i < vietnamese.length; i++) {
      result = result.replaceAll(vietnamese[i], without[i]);
    }
    return result;
  }
}

class Ward {
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Ward && runtimeType == other.runtimeType && name == other.name;

  @override
  int get hashCode => name.hashCode;
  final String name;

  Ward({required this.name});

  factory Ward.fromJson(Map<String, dynamic> json) {
    final name = json['name'] ?? '';
    return Ward(name: name);
  }
}

class VietnamProvinceService {
  static const String _baseUrl = "https://vietnamlabs.com/api/vietnamprovince";

  /// Lấy tất cả tỉnh/thành
  Future<List<Province>> fetchProvinces() async {
    final response = await http.get(Uri.parse(_baseUrl));
    if (response.statusCode != 200) {
      throw Exception("Failed to load provinces");
    }

    final decoded = jsonDecode(response.body);
    final List data = decoded['data'] ?? [];
    List<Province> provinces = data
        .map((item) => Province.fromJson(item))
        .toList();

    provinces.sort(
      (a, b) => a.nameWithoutDiacritics.compareTo(b.nameWithoutDiacritics),
    );

    return provinces;
  }

  /// Tìm kiếm tỉnh (offline từ list đã tải)
  List<Province> searchProvinces(String keyword, List<Province> provinces) {
    if (keyword.isEmpty) return provinces;

    final kw = Province.removeVietnameseDiacritics(keyword).toLowerCase();
    final result = provinces
        .where((p) => p.nameWithoutDiacritics.contains(kw))
        .toList();

    result.sort(
      (a, b) => a.nameWithoutDiacritics.compareTo(b.nameWithoutDiacritics),
    );

    return result;
  }

  /// Lấy tất cả phường/xã từ 1 tỉnh
  List<Ward> getWardsByProvince(String provinceName, List<Province> provinces) {
    final province = provinces.firstWhere(
      (p) => p.name == provinceName,
      orElse: () =>
          Province(id: '', name: '', nameWithoutDiacritics: '', wards: []),
    );
    return province.wards;
  }

  /// Tìm kiếm phường/xã (offline từ list đã tải)
  List<Ward> searchWards(String keyword, List<Ward> wards) {
    if (keyword.isEmpty) return wards;

    final kw = Province.removeVietnameseDiacritics(keyword).toLowerCase();
    final result = wards
        .where(
          (w) => Province.removeVietnameseDiacritics(
            w.name,
          ).toLowerCase().contains(kw),
        )
        .toList();

    result.sort(
      (a, b) => Province.removeVietnameseDiacritics(a.name)
          .toLowerCase()
          .compareTo(Province.removeVietnameseDiacritics(b.name).toLowerCase()),
    );

    return result;
  }
}
