import 'package:flutter/material.dart';
import '../../../classes/blog_model.dart';
import '../../../classes/blog_comment_model.dart';
import '../../../classes/blog_image_model.dart';
import '../../../services/blog_service.dart';
import '../../../services/token_service.dart';
import 'widgets/blog_comment_tree.dart';
import 'widgets/blog_detail_loader.dart';

class BlogDetailScreen extends StatefulWidget {
  final String blogSlug; // Đổi từ blogId thành blogSlug

  const BlogDetailScreen({Key? key, required this.blogSlug}) : super(key: key);

  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  final BlogService _blogService = BlogService();
  final TextEditingController _commentController = TextEditingController();

  Blog? blog;
  List<BlogImage> blogImages = [];
  List<BlogComment> comments = [];
  bool isLoading = true;
  bool isLoadingImages = true;
  bool isLoadingComments = true;
  bool isSubmittingComment = false;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadBlogDetail();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadBlogDetail() async {
    try {
      final result = await _blogService.getBlogBySlug(widget.blogSlug);
      if (result['success']) {
        setState(() {
          blog = result['data'];
          isLoading = false;
        });
        // Sau khi có blog, load images và comments với blogId
        if (blog != null) {
          _loadBlogImages();
          _loadBlogComments();
        }
      } else {
        setState(() {
          error = result['message'];
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Lỗi khi tải blog: $e';
        isLoading = false;
      });
    }
  }

  Future<void> _loadBlogImages() async {
    if (blog == null) return;

    try {
      print('DEBUG: _loadBlogImages for blogId: ${blog!.blogId}');

      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      if (token == null) {
        print('DEBUG: No token found for loading images');
        setState(() {
          isLoadingImages = false;
        });
        return;
      }

      final result = await _blogService.getImages(blog!.blogId, token);
      print('DEBUG: getImages result: $result');

      if (result['success']) {
        final List<dynamic> imageData = result['data'] ?? [];
        print('DEBUG: imageData length: ${imageData.length}');

        setState(() {
          blogImages = imageData
              .map((json) => BlogImage.fromJson(json))
              .toList();
          print('DEBUG: blogImages parsed length: ${blogImages.length}');
          isLoadingImages = false;
        });
      } else {
        print('DEBUG: getImages error: ${result['message']}');
        setState(() {
          isLoadingImages = false;
        });
      }
    } catch (e) {
      print('DEBUG: getImages exception: $e');
      setState(() {
        isLoadingImages = false;
      });
    }
  }

  Future<void> _loadBlogComments() async {
    if (blog == null) return;

    try {
      print('DEBUG: _loadBlogComments for blogId: ${blog!.blogId}');

      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      if (token == null) {
        print('DEBUG: No token found for loading comments');
        setState(() {
          isLoadingComments = false;
        });
        return;
      }

      final result = await _blogService.getBlogComments(
        blog!.blogId,
        token: token,
      );
      print('DEBUG: getBlogComments result: $result');
      if (result['success']) {
        final List<dynamic> commentData = result['data'] ?? [];
        print('DEBUG: commentData length: ${commentData.length}');
        for (var c in commentData) {
          print('DEBUG: comment json: $c');
        }
        setState(() {
          comments = commentData
              .map((json) => BlogComment.fromJson(json))
              .toList();
          print('DEBUG: comments parsed length: ${comments.length}');
          isLoadingComments = false;
        });
      } else {
        print('DEBUG: getBlogComments error: ${result['message']}');
        setState(() {
          isLoadingComments = false;
        });
      }
    } catch (e) {
      print('DEBUG: getBlogComments exception: $e');
      setState(() {
        isLoadingComments = false;
      });
    }
  }

  Future<void> _submitComment() async {
    if (_commentController.text.trim().isEmpty || blog == null) return;

    setState(() {
      isSubmittingComment = true;
    });

    try {
      // Cần token để submit comment
      // final result = await _blogService.addComment(
      //   blog!.blogId,
      //   _commentController.text.trim(),
      //   'your_token_here',
      // );

      // if (result['success']) {
      //   _commentController.clear();
      //   _loadBlogComments(); // Reload comments
      // }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi khi gửi bình luận: $e')));
    } finally {
      setState(() {
        isSubmittingComment = false;
      });
    }
  }

  List<BlogComment> _buildCommentTree(List<BlogComment> comments) {
    // Tạo map để dễ dàng tìm kiếm comments
    Map<String, BlogComment> commentMap = {};
    Map<String, List<BlogComment>> childrenMap = {};
    List<BlogComment> rootComments = [];

    // Khởi tạo maps
    for (var comment in comments) {
      commentMap[comment.commentId] = comment;
      childrenMap[comment.commentId] = [];
    }

    // Phân loại root comments và child comments
    for (var comment in comments) {
      if (comment.parentCommentId == null) {
        // Root comment
        rootComments.add(comment);
      } else {
        // Child comment
        if (childrenMap.containsKey(comment.parentCommentId!)) {
          childrenMap[comment.parentCommentId!]!.add(comment);
        }
      }
    }

    // Gắn children vào parent comments
    for (var commentId in childrenMap.keys) {
      if (childrenMap[commentId]!.isNotEmpty &&
          commentMap.containsKey(commentId)) {
        final parentComment = commentMap[commentId]!;
        final updatedParent = parentComment.copyWith(
          replies: childrenMap[commentId],
        );
        commentMap[commentId] = updatedParent;

        // Cập nhật trong rootComments nếu là root comment
        final rootIndex = rootComments.indexWhere(
          (c) => c.commentId == commentId,
        );
        if (rootIndex != -1) {
          rootComments[rootIndex] = updatedParent;
        }
      }
    }

    // Sắp xếp comments theo thời gian tạo (mới nhất trước)
    rootComments.sort((a, b) => b.createdAt.compareTo(a.createdAt));

    // Sắp xếp replies theo thời gian tạo (cũ nhất trước cho replies)
    for (var comment in rootComments) {
      if (comment.replies != null && comment.replies!.isNotEmpty) {
        comment.replies!.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      }
    }

    return rootComments;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(blog?.title ?? 'Blog Detail'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: isLoading
          ? const BlogDetailLoader()
          : error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(error!),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        isLoading = true;
                        error = null;
                      });
                      _loadBlogDetail();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Blog Title
                  _buildTitle(),
                  const SizedBox(height: 24),

                  // Blog Content
                  _buildContent(),
                  const SizedBox(height: 24),

                  // Blog Images
                  _buildImages(),
                  const SizedBox(height: 24),

                  // Comments Section
                  _buildCommentsSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildTitle() {
    return Text(
      blog?.title ?? '',
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildContent() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Text(
        blog?.content ?? '',
        style: const TextStyle(
          fontSize: 16,
          height: 1.6,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildImages() {
    if (isLoadingImages) {
      return const Center(child: CircularProgressIndicator());
    }

    if (blogImages.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Hình ảnh',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: blogImages.length,
          itemBuilder: (context, index) {
            final image = blogImages[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child:
                        image.imageUrl.isNotEmpty &&
                            !image.imageUrl.contains('example.com') &&
                            !image.imageUrl.contains('google.com/url')
                        ? Image.network(
                            image.imageUrl,
                            width: double.infinity,
                            height: 200,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Container(
                                width: double.infinity,
                                height: 200,
                                color: Colors.grey[200],
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Image.asset(
                                'assets/welcome/welcome-image-1.png',
                                width: double.infinity,
                                height: 200,
                                fit: BoxFit.cover,
                              );
                            },
                          )
                        : Image.asset(
                            'assets/welcome/welcome-image-1.png',
                            width: double.infinity,
                            height: 200,
                            fit: BoxFit.cover,
                          ),
                  ),
                  if (image.hasCaption) ...[
                    const SizedBox(height: 8),
                    Text(
                      image.caption!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildCommentsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Bình luận',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            Text(
              '(${comments.length})',
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Comment Input
        _buildCommentInput(),
        const SizedBox(height: 20),

        // Comments Tree
        _buildCommentsList(),
      ],
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Viết bình luận...',
              border: InputBorder.none,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ElevatedButton(
                onPressed: isSubmittingComment ? null : _submitComment,
                child: isSubmittingComment
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Gửi'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCommentsList() {
    if (isLoadingComments) {
      return const Center(child: CircularProgressIndicator());
    }

    if (comments.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            'Chưa có bình luận nào',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    final rootComments = _buildCommentTree(comments);

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: rootComments.length,
      itemBuilder: (context, index) {
        return BlogCommentTree(
          comment: rootComments[index],
          onReply: (parentComment) {
            // Handle reply logic
            _showReplyDialog(parentComment);
          },
          onDelete: (comment) {
            // Handle delete logic
            _showDeleteDialog(comment);
          },
        );
      },
    );
  }

  void _showReplyDialog(BlogComment parentComment) {
    final replyController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Trả lời ${parentComment.authorName}'),
        content: TextField(
          controller: replyController,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Viết phản hồi...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              // Handle reply submission
              Navigator.pop(context);
            },
            child: const Text('Gửi'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BlogComment comment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bình luận'),
        content: const Text('Bạn có chắc chắn muốn xóa bình luận này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              // Handle delete
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}
