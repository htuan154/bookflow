import 'package:flutter/material.dart';
import '../home/components/blog_card.dart';
import '../../services/blog_service.dart';
import '../../classes/blog_model.dart';
import '../../screens/home/form/province_ward_form.dart';

class HomeScreen extends StatefulWidget {
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // --- Widget chọn tỉnh/phường giống main.dart demo ---
  // Không cần logic chọn tỉnh/phường ở HomeScreen, đã có ProvinceWardForm riêng
  List<Blog> blogs = [];
  bool isLoading = true;
  String error = '';

  @override
  void initState() {
    super.initState();
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
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Chọn Tỉnh/Phường'),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black),
        titleTextStyle: const TextStyle(color: Colors.black, fontSize: 18),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await fetchBlogs();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ProvinceWardForm(),
              const SizedBox(height: 24),
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
                        const SnackBar(content: Text('See all blogs clicked!')),
                      );
                    },
                    child: const Text(
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
              const SizedBox(height: 16),
              if (isLoading) const Center(child: CircularProgressIndicator()),
              if (error.isNotEmpty)
                Center(
                  child: Text(error, style: const TextStyle(color: Colors.red)),
                ),
              if (!isLoading && error.isEmpty)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: blogs.length,
                  itemBuilder: (context, index) {
                    final blog = blogs[index];
                    return BlogCard(blog: blog);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
