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