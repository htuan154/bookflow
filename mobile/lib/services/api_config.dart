import 'dart:io';

class ApiConfig {
  // Sử dụng IP phù hợp cho từng platform
  static String get baseUrl {
    if (Platform.isAndroid) {
      // Physical Android device - dùng IP thực của máy
      return 'http://192.168.1.5:8080/api/v1';
    } else if (Platform.isIOS) {
      // iOS device - dùng IP thực của máy
      return 'http://192.168.1.5:8080/api/v1';
    } else {
      // Web và platform khác
      return 'http://192.168.1.5:8080/api/v1';
    }
  }
}
