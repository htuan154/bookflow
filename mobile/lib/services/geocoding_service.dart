import 'dart:convert';
import 'package:http/http.dart' as http;

class GeocodingService {
  // 🔐 API keys
  static const String _locationIqApiKey = 'pk.d75021439822221837de9db540215839';
  static const String _geoapifyApiKey = 'b879bdc233664dbeb0ad52b5e9557e8d';
  static const String _openCageApiKey = 'e71e2cea3855415580670a8cacd8e602';

  /// Hàm gọi chung trả về tọa độ, ưu tiên LocationIQ > Geoapify > OpenCage
  static Future<Map<String, double>?> getCoordinatesFromAddress(
    String address,
  ) async {
    Map<String, double>? result;

    // ⚙️ Thử LocationIQ
    result = await _getFromLocationIQ(address);
    if (result != null) return result;

    // ⚙️ Thử Geoapify
    result = await _getFromGeoapify(address);
    if (result != null) return result;

    // ⚙️ Thử OpenCage
    result = await _getFromOpenCage(address);
    return result; // có thể null nếu tất cả đều fail
  }

  /// 📍 LocationIQ
  static Future<Map<String, double>?> _getFromLocationIQ(String address) async {
    final encodedAddress = Uri.encodeComponent(address);
    final url = Uri.parse(
      'https://us1.locationiq.com/v1/search.php'
      '?key=$_locationIqApiKey'
      '&q=$encodedAddress'
      '&format=json'
      '&limit=1'
      '&countrycodes=vn',
    );

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) {
          final result = data[0];
          print("✅ Lấy từ LocationIQ");
          return {
            'latitude': double.parse(result['lat']),
            'longitude': double.parse(result['lon']),
          };
        }
      } else {
        print("❌ LocationIQ lỗi: ${response.statusCode}");
      }
    } catch (e) {
      print("❌ Lỗi LocationIQ: $e");
    }

    return null;
  }

  /// 🗺️ Geoapify
  static Future<Map<String, double>?> _getFromGeoapify(String address) async {
    final encodedAddress = Uri.encodeComponent(address);
    final url = Uri.parse(
      'https://api.geoapify.com/v1/geocode/search'
      '?text=$encodedAddress'
      '&lang=vi'
      '&limit=1'
      '&apiKey=$_geoapifyApiKey',
    );

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['features'] != null &&
            data['features'] is List &&
            data['features'].isNotEmpty) {
          final geometry = data['features'][0]['geometry'];
          final coordinates = geometry['coordinates'];
          print("✅ Lấy từ Geoapify");
          return {'latitude': coordinates[1], 'longitude': coordinates[0]};
        }
      } else {
        print("❌ Geoapify lỗi: ${response.statusCode}");
      }
    } catch (e) {
      print("❌ Lỗi Geoapify: $e");
    }

    return null;
  }

  /// 🌍 OpenCage
  static Future<Map<String, double>?> _getFromOpenCage(String address) async {
    final encodedAddress = Uri.encodeComponent(address);
    final url = Uri.parse(
      'https://api.opencagedata.com/geocode/v1/json'
      '?q=$encodedAddress'
      '&key=$_openCageApiKey'
      '&language=vi'
      '&limit=1',
    );

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['results'] != null &&
            data['results'] is List &&
            data['results'].isNotEmpty) {
          final geometry = data['results'][0]['geometry'];
          print("✅ Lấy từ OpenCage");
          return {'latitude': geometry['lat'], 'longitude': geometry['lng']};
        }
      } else {
        print("❌ OpenCage lỗi: ${response.statusCode}");
      }
    } catch (e) {
      print("❌ Lỗi OpenCage: $e");
    }

    return null;
  }

  /// 🔁 Lấy địa chỉ từ tọa độ
  static Future<String?> getAddressFromCoordinates(
    double lat,
    double lon,
  ) async {
    final url = Uri.parse(
      'https://api.opencagedata.com/geocode/v1/json'
      '?q=$lat+$lon'
      '&key=$_openCageApiKey'
      '&language=vi'
      '&limit=1',
    );

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['results'] != null && data['results'].isNotEmpty) {
          print("✅ Địa chỉ lấy từ OpenCage");
          return data['results'][0]['formatted'];
        }
      } else {
        print("❌ Lỗi reverse geocoding: ${response.statusCode}");
      }
    } catch (e) {
      print("❌ Exception khi reverse geocoding: $e");
    }
    return null;
  }
}
