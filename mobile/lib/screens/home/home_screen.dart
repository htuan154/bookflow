import 'package:flutter/material.dart';
import '../home/components/blog_card.dart';
import '../../services/blog_service.dart';
//import '../../classes/blog_model.dart';
import '../../screens/home/form/province_ward_form.dart';
import '../../classes/blog_custom_model.dart';


class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<BlogCustom> blogs = [];
  bool isLoadingBlogs = true;
  bool isLoadingProvince = true;
  String error = '';

  // Computed property để check cả hai đã load xong chưa
  bool get isLoading => isLoadingBlogs || isLoadingProvince;

  @override
  void initState() {
    super.initState();
    fetchAll();
  }

  // Hàm load cả hai API cùng lúc
  Future<void> fetchAll() async {
    print('DEBUG HomeScreen: fetchAll() called');
    setState(() {
      isLoadingBlogs = true;
      isLoadingProvince = true;
      error = '';
    });

    // Chỉ gọi fetchBlogs, province sẽ load qua ProvinceWardForm
    await fetchBlogs();
    setState(() {}); // Cập nhật UI sau khi blog load xong
  }

  Future<void> fetchBlogs() async {
    final result = await BlogService().getPublishedBlogs();
    print('DEBUG HomeScreen: Blog API result: ${result['success']}');

    if (result['success'] == true) {
      blogs = List<BlogCustom>.from(result['data']);
    } else {
      print('DEBUG HomeScreen: Blog Error: ${result['message']}');
      error = result['message'] ?? 'Lỗi khi lấy blog';
    }
    isLoadingBlogs = false;
  }

  Future<void> fetchProvince() async {
    // Bỏ hàm này hoặc để trống
    print('DEBUG HomeScreen: Province will load via ProvinceWardForm callback');
  }

  // Callback từ ProvinceWardForm khi province load xong
  void onProvinceLoaded() {
    setState(() {
      isLoadingProvince = false;
    });
    print('DEBUG HomeScreen: Province API completed via callback');
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
          // Khi refresh chỉ load lại blog
          await fetchBlogs();
          setState(() {});
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Luôn hiển thị ProvinceWardForm để callback hoạt động
              ProvinceWardForm(onLoadCompleted: onProvinceLoaded),
              const SizedBox(height: 24),

              // Hiển thị loading hoặc nội dung blog
              if (isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(50.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (error.isNotEmpty)
                Center(
                  child: Text(error, style: const TextStyle(color: Colors.red)),
                )
              else ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Blogs',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('See all blogs clicked!'),
                          ),
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
            ],
          ),
        ),
      ),
    );
  }
}
