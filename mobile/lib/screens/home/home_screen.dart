import 'package:flutter/material.dart';
import '../home/components/blog_card.dart';
import '../../services/blog_service.dart';
//import '../../classes/blog_model.dart';
import '../../screens/home/form/province_ward_form.dart';
import '../../classes/blog_custom_model.dart';
import '../../components/admin_contact_dialog.dart';


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

  int currentPage = 1;
  final int pageSize = 10;
  bool hasMore = true;
  bool loadingMore = false;
  late ScrollController _scrollController;

  bool get isLoading => isLoadingBlogs || isLoadingProvince;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);
    fetchAll();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 && hasMore && !loadingMore && !isLoadingBlogs) {
      fetchMoreBlogs();
    }
  }

  Future<void> fetchAll() async {
    print('DEBUG HomeScreen: fetchAll() called');
    setState(() {
      isLoadingBlogs = true;
      isLoadingProvince = true;
      error = '';
      blogs = [];
      currentPage = 1;
      hasMore = true;
    });
    await fetchBlogs(reset: true);
    setState(() {});
  }

  Future<void> fetchBlogs({bool reset = false}) async {
    if (reset) {
      blogs = [];
      currentPage = 1;
      hasMore = true;
    }
    final result = await BlogService().getPublishedBlogs(page: currentPage, limit: pageSize);
    print('DEBUG HomeScreen: Blog API result: ${result['success']}');

    if (result['success'] == true) {
      List<BlogCustom> newBlogs = List<BlogCustom>.from(result['data']);
      if (reset) {
        blogs = newBlogs;
      } else {
        blogs.addAll(newBlogs);
      }
      // Kiểm tra còn dữ liệu không
      if (newBlogs.length < pageSize) {
        hasMore = false;
      } else {
        hasMore = true;
      }
    } else {
      print('DEBUG HomeScreen: Blog Error: ${result['message']}');
      error = result['message'] ?? 'Lỗi khi lấy blog';
      hasMore = false;
    }
    isLoadingBlogs = false;
    loadingMore = false;
    setState(() {});
  }

  Future<void> fetchMoreBlogs() async {
    if (!hasMore || loadingMore) return;
    loadingMore = true;
    currentPage++;
    await fetchBlogs();
  }

  Future<void> fetchProvince() async {
    print('DEBUG HomeScreen: Province will load via ProvinceWardForm callback');
  }

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
        title: Text(
          'Trang chủ',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        automaticallyImplyLeading: false,
        backgroundColor: Colors.orange,
        iconTheme: const IconThemeData(color: Colors.white),
        //titleTextStyle: const TextStyle(color: Colors.black, fontSize: 18),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.contact_support, color: Colors.white),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AdminContactDialog(),
              );
            },
            tooltip: 'Liên hệ',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await fetchAll();
        },
        child: ListView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            ProvinceWardForm(onLoadCompleted: onProvinceLoaded),
            const SizedBox(height: 24),
            if (isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(50.0),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (error.isNotEmpty)
              Center(
                child: Text(error, style: TextStyle(color: Colors.red)),
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
                  // GestureDetector(
                  //   onTap: () {
                  //     ScaffoldMessenger.of(context).showSnackBar(
                  //       const SnackBar(
                  //         content: Text('See all blogs clicked!'),
                  //       ),
                  //     );
                  //   },
                  //   child: const Text(
                  //     'See all',
                  //     style: TextStyle(
                  //       color: Colors.orange,
                  //       fontSize: 16,
                  //       fontWeight: FontWeight.w500,
                  //     ),
                  //   ),
                  // ),
                ],
              ),
              const SizedBox(height: 16),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: blogs.length + (hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index < blogs.length) {
                    final blog = blogs[index];
                    return BlogCard(blog: blog);
                  } else {
                    // Hiển thị loading ở cuối khi còn dữ liệu
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
