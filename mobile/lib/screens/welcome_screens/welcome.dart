import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:ui';
import 'package:video_player/video_player.dart';
import 'connect.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with SingleTickerProviderStateMixin {
  late VideoPlayerController _videoController;
  late AnimationController _logoAnimController;
  late Animation<Offset> _logoSlideAnimation;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.asset('assets/video/loginform.mp4')
      ..initialize().then((_) {
        setState(() {});
        _videoController.play();
        _videoController.setLooping(true);
      });
    _logoAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _logoSlideAnimation = Tween<Offset>(
      begin: const Offset(0, 1.2), // Start below the screen
      end: const Offset(0, 0),     // End at target position
    ).animate(CurvedAnimation(
      parent: _logoAnimController,
      curve: Curves.easeOutBack,
    ));
    // Start the logo animation after a short delay for effect
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _logoAnimController.forward();
    });
    // Auto-navigate after 4.5 seconds
    Timer(const Duration(milliseconds: 4500), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const ConnectScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _videoController.dispose();
    _logoAnimController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video background
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
          // Logo at 1/3 from top, animating up from below
          SafeArea(
            child: Stack(
              children: [
                Center(
                  child: SlideTransition(
                    position: _logoSlideAnimation,
                    child: Image.asset(
                      'assets/welcome/logo.png',
                      width: 360,
                      height: 360,
                      filterQuality: FilterQuality.high,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
