import 'package:flutter/material.dart';
import 'package:client_khachhang/screens/sign_up_form/sign_up_form.dart';
import 'dart:ui';
import 'package:client_khachhang/services/auth_service.dart';
import 'package:client_khachhang/services/token_service.dart';
import 'package:client_khachhang/services/user_service.dart';
import 'package:client_khachhang/models/navbar.dart';
import 'package:video_player/video_player.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool isPasswordVisible = false;
  bool isLoading = false;
  
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
    passwordController.dispose();
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

          // Glassmorphism login form
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
                              'Sign in',
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
                              'Hi Welcome! Continue to login',
                              style: TextStyle(fontSize: 16, color: Colors.white70),
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
                              ),
                            ),

                            const SizedBox(height: 10),

                            // Forgot password
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () {
                                  // Handle forgot password
                                },
                                child: const Text(
                                  'Forgot Password',
                                  style: TextStyle(color: Colors.white, fontSize: 14),
                                ),
                              ),
                            ),

                            const SizedBox(height: 18),

                            // Sign in button
                            ElevatedButton(
                              onPressed: isLoading ? null : _handleSignIn,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFFF5722),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: isLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text(
                                      'Continue',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                            ),

                            const SizedBox(height: 10),

                            // Sign up link
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  "Don't have an account? ",
                                  style: TextStyle(color: Colors.white70, fontSize: 14),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => SignUpScreen(),
                                      ),
                                    );
                                  },
                                  child: const Text(
                                    'Sign up',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      decoration: TextDecoration.underline,
                                    ),
                                  ),
                                ),
                              ],
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

  Future<void> _handleSignIn() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    // // Validate email format
    // if (!RegExp(
    //   r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
    // ).hasMatch(emailController.text)) {
    //   ScaffoldMessenger.of(context).showSnackBar(
    //     const SnackBar(content: Text('Please enter a valid email address')),
    //   );
    //   return;
    // }

    setState(() {
      isLoading = true;
    });

    try {
      print('Attempting login with email: ${emailController.text}');
      final response = await _authService.login(
        email: emailController.text.trim(),
        password: passwordController.text,
      );

      print('Login response: $response');

      if (response['success'] == true) {
        // Lưu token vào storage
        final token = response['token'];
        if (token != null) {
          await TokenService.saveToken(token);
          print('Token saved successfully');
        }

        // Lưu thông tin user vào storage
        final user = response['user'];
        if (user != null) {
          await UserService.saveUser(user);
          print('User data saved successfully');
        }

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Login successful!')));
        // Navigate to main app screen (NavBar)
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => NavBar()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response['message'] ?? 'Login failed')),
        );
      }
    } catch (error) {
      print('Login error: $error');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $error')));
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

}
