import 'package:flutter/material.dart';

class BlogDetailLoader extends StatelessWidget {
  const BlogDetailLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title skeleton
          _buildSkeletonBox(
            height: 30,
            width: MediaQuery.of(context).size.width * 0.8,
          ),
          const SizedBox(height: 12),
          _buildSkeletonBox(
            height: 30,
            width: MediaQuery.of(context).size.width * 0.6,
          ),
          const SizedBox(height: 24),
          
          // Content skeleton
          _buildSkeletonBox(
            height: 200,
            width: double.infinity,
          ),
          const SizedBox(height: 24),
          
          // Images skeleton
          _buildSkeletonBox(
            height: 200,
            width: double.infinity,
          ),
          const SizedBox(height: 24),
          
          // Comments skeleton
          _buildSkeletonBox(
            height: 20,
            width: 120,
          ),
          const SizedBox(height: 16),
          
          // Comment items skeleton
          ...List.generate(3, (index) => Container(
            margin: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildSkeletonCircle(32),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSkeletonBox(height: 14, width: 100),
                        const SizedBox(height: 4),
                        _buildSkeletonBox(height: 12, width: 60),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _buildSkeletonBox(
                  height: 16,
                  width: MediaQuery.of(context).size.width * 0.9,
                ),
                const SizedBox(height: 4),
                _buildSkeletonBox(
                  height: 16,
                  width: MediaQuery.of(context).size.width * 0.7,
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildSkeletonBox({
    required double height,
    required double width,
  }) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }

  Widget _buildSkeletonCircle(double size) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        shape: BoxShape.circle,
      ),
    );
  }
}
