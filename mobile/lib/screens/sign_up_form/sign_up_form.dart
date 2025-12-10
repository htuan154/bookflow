import 'package:flutter/material.dart';
import 'package:client_khachhang/screens/login_form/login_form.dart';
import 'dart:ui';
import 'package:video_player/video_player.dart';
import '../../services/auth_service.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  _SignUpScreenState createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
    String? emailError;
    String? fullNameError;
    String? usernameError;
    String? passwordError;
  final TextEditingController emailController = TextEditingController();
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController usernameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool isPasswordVisible = false;
  bool isAgreeTerms = true;
  late VideoPlayerController _videoController;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.asset('assets/video/loginform.mp4')
      ..initialize().then((_) {
        setState(() {});
        _videoController.play();
        _videoController.setLooping(true);
      });
  }

  @override
  void dispose() {
    _videoController.dispose();
    emailController.dispose();
    usernameController.dispose();
    passwordController.dispose();
    fullNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background video full screen
          if (_videoController.value.isInitialized)
            SizedBox.expand(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _videoController.value.size.width,
                  height: _videoController.value.size.height,
                  child: VideoPlayer(_videoController),
                ),
              ),
            ),

          // Dark overlay
          Container(
            color: Colors.black.withOpacity(0.3),
          ),

          // Glassmorphism sign up form
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withOpacity(0.18), width: 1.5),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 36.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Title
                            const Text(
                              'Create Account',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              textAlign: TextAlign.center,
                            ),

                            const SizedBox(height: 8),

                            // Subtitle
                            const Text(
                              'Fill your details below, or register\nwith social account',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white70,
                                height: 1.4,
                              ),
                              textAlign: TextAlign.center,
                            ),

                            const SizedBox(height: 36),

                            // Email field
                            const Text(
                              'Email',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),

                            const SizedBox(height: 8),

                            TextField(
                              controller: emailController,
                              keyboardType: TextInputType.emailAddress,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'name@example.com',
                                hintStyle: const TextStyle(color: Colors.white60),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Colors.white, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                                errorStyle: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  backgroundColor: Colors.transparent,
                                ),
                                errorText: null,
                              ),
                            ),
                            if (emailError != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 6, left: 2, right: 2, bottom: 2),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade700.withOpacity(0.95),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  child: Text(
                                    emailError!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                              ),

                            const SizedBox(height: 20),

                            // Full Name field
                            const Text(
                              'Full Name',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),

                            const SizedBox(height: 8),

                            TextField(
                              controller: fullNameController,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Your full name',
                                hintStyle: const TextStyle(color: Colors.white60),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Colors.white, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                                errorStyle: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  backgroundColor: Colors.transparent,
                                ),
                                errorText: null,
                              ),
                            ),
                            if (fullNameError != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 6, left: 2, right: 2, bottom: 2),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade700.withOpacity(0.95),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  child: Text(
                                    fullNameError!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                              ),

                            const SizedBox(height: 20),

                            // Username field
                            const Text(
                              'Username',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),

                            const SizedBox(height: 8),

                            TextField(
                              controller: usernameController,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Name',
                                hintStyle: const TextStyle(color: Colors.white60),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Colors.white, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                                errorStyle: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  backgroundColor: Colors.transparent,
                                ),
                                errorText: null,
                              ),
                            ),
                            if (usernameError != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 6, left: 2, right: 2, bottom: 2),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade700.withOpacity(0.95),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  child: Text(
                                    usernameError!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                              ),

                            const SizedBox(height: 20),

                            // Password field
                            const Text(
                              'Password',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),

                            const SizedBox(height: 8),

                            TextField(
                              controller: passwordController,
                              obscureText: !isPasswordVisible,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: '••••••••••••',
                                hintStyle: const TextStyle(color: Colors.white60),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Colors.white, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                                suffixIcon: IconButton(
                                  onPressed: () {
                                    setState(() {
                                      isPasswordVisible = !isPasswordVisible;
                                    });
                                  },
                                  icon: Icon(
                                    isPasswordVisible
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                    color: Colors.white70,
                                  ),
                                ),
                                errorStyle: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  backgroundColor: Colors.transparent,
                                ),
                                errorText: null,
                              ),
                            ),
                            if (passwordError != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 6, left: 2, right: 2, bottom: 2),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade700.withOpacity(0.95),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  child: Text(
                                    passwordError!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                              ),

                            const SizedBox(height: 10),

                            // Terms and Conditions checkbox
                            Row(
                              children: [
                                Checkbox(
                                  value: isAgreeTerms,
                                  onChanged: (value) {
                                    setState(() {
                                      isAgreeTerms = value ?? false;
                                    });
                                  },
                                  activeColor: const Color(0xFFFF5722),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                                Expanded(
                                  child: RichText(
                                    text: TextSpan(
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.white,
                                      ),
                                      children: [
                                        const TextSpan(text: 'Agree with '),
                                        TextSpan(
                                          text: 'Terms & Conditions',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            decoration: TextDecoration.underline,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 18),

                            // Sign Up button
                            ElevatedButton(
                              onPressed: isAgreeTerms
                                  ? () async {
                                      setState(() {
                                        emailError = null;
                                        fullNameError = null;
                                        usernameError = null;
                                        passwordError = null;
                                      });
                                      final email = emailController.text.trim();
                                      final fullName = fullNameController.text.trim();
                                      final username = usernameController.text.trim();
                                      final password = passwordController.text;
                                      bool hasError = false;
                                      // Email validation
                                      if (email.isEmpty) {
                                        setState(() { emailError = 'Vui lòng nhập email.'; });
                                        hasError = true;
                                      } else if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
                                        setState(() { emailError = 'Email không hợp lệ.'; });
                                        hasError = true;
                                      }
                                      // Full name validation
                                      if (fullName.isEmpty) {
                                        setState(() { fullNameError = 'Vui lòng nhập họ tên.'; });
                                        hasError = true;
                                      }
                                      // Username validation
                                      if (username.isEmpty) {
                                        setState(() { usernameError = 'Vui lòng nhập tên đăng nhập.'; });
                                        hasError = true;
                                      } else if (username.length < 4) {
                                        setState(() { usernameError = 'Tên đăng nhập phải từ 4 ký tự.'; });
                                        hasError = true;
                                      }
                                      // Password validation
                                      if (password.isEmpty) {
                                        setState(() { passwordError = 'Vui lòng nhập mật khẩu.'; });
                                        hasError = true;
                                      } else if (password.length < 6) {
                                        setState(() { passwordError = 'Mật khẩu phải từ 6 ký tự.'; });
                                        hasError = true;
                                      }
                                      if (hasError) return;
                                      final result = await AuthService().register(
                                        username: username,
                                        email: email,
                                        password: password,
                                        fullName: fullName,
                                      );
                                      if (result['success'] == true) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              result['message'] ??
                                                  'Đăng ký thành công!',
                                            ),
                                          ),
                                        );
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => LoginScreen(),
                                          ),
                                        );
                                      } else {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              result['message'] ?? 'Đăng ký thất bại!',
                                            ),
                                          ),
                                        );
                                      }
                                    }
                                  : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFFF5722),
                                foregroundColor: Colors.white,
                                disabledBackgroundColor: Colors.grey.shade300,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: const Text(
                                'Sign Up',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),

                            const SizedBox(height: 10),

                            // Sign in link
                            Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text(
                                    'Already have an account? ',
                                    style: TextStyle(color: Colors.white70, fontSize: 14),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => LoginScreen(),
                                        ),
                                      );
                                    },
                                    child: const Text(
                                      'Sign in',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
