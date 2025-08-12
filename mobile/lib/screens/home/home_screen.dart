// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import '../home/components/blog_card.dart';
import '../../services/blog_service.dart';
import '../../classes/blog_model.dart';

class HomeScreen extends StatefulWidget {
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Blog> blogs = [];
  bool isLoading = true;
  String error = '';

  @override
  void initState() {
    super.initState();
    print('DEBUG HomeScreen: initState() called');
    fetchBlogs();
  }

  Future<void> fetchBlogs() async {
    print('DEBUG HomeScreen: fetchBlogs() called');
    setState(() {
      isLoading = true;
      error = '';
    });
    final result = await BlogService().getPublishedBlogs();
    print('DEBUG HomeScreen: API result: ${result['success']}');
    if (result['success'] == true) {
      setState(() {
        blogs = List<Blog>.from(result['data']);
        isLoading = false;
      });
    } else {
      print('DEBUG HomeScreen: Error: ${result['message']}');
      setState(() {
        error = result['message'] ?? 'Lỗi khi lấy blog';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.location_on, color: Colors.orange),
            SizedBox(width: 4),
            Text('New York, USA', style: TextStyle(fontSize: 16)),
            Icon(Icons.keyboard_arrow_down),
          ],
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: Icon(Icons.notifications_outlined, color: Colors.orange),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Notifications clicked!')),
                  );
                },
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
        backgroundColor: Colors.white,
        iconTheme: IconThemeData(color: Colors.black),
        titleTextStyle: TextStyle(color: Colors.black, fontSize: 18),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Bar
            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text('Search clicked!')));
              },
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, color: Colors.grey),
                    SizedBox(width: 12),
                    Text(
                      'Search',
                      style: TextStyle(color: Colors.grey[600], fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24),
            // Blog Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Blogs',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('See all blogs clicked!')),
                    );
                  },
                  child: Text(
                    'See all',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            if (isLoading) Center(child: CircularProgressIndicator()),
            if (error.isNotEmpty)
              Center(
                child: Text(error, style: TextStyle(color: Colors.red)),
              ),
            if (!isLoading && error.isEmpty)
              ListView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                itemCount: blogs.length,
                itemBuilder: (context, index) {
                  final blog = blogs[index];
                  return BlogCard(blog: blog);
                },
              ),
          ],
        ),
      ),
    );
  }
}
